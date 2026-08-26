import { EventSource } from 'eventsource';

import type { DeploymentManagerClient } from '../../../../client/deployment-manager/index.js';
import type {
  DeploymentState,
  DeploymentStreamEvent,
  DeploymentStreamEventOf,
  DeploymentStreamHandlers,
  DeploymentStreamSubscription,
} from '../../types.js';

/**
 * Every frame arrives as an unnamed `message`, discriminated by a `type` field
 * in its payload rather than by the SSE `event:` line, so the handler for a
 * frame is chosen here rather than by `addEventListener`. Each entry makes the
 * call itself: a bare `handlers[name]` lookup loses the link between a frame's
 * type and its handler's parameter, but a mapped table keyed by the
 * discriminant keeps them correlated.
 */
const DISPATCH: {
  [T in DeploymentStreamEvent['type']]: (
    handlers: DeploymentStreamHandlers,
    event: DeploymentStreamEventOf<T>,
  ) => void;
} = {
  deployment: (handlers, event) => handlers.onDeployment?.(event),
  job: (handlers, event) => handlers.onJob?.(event),
  event: (handlers, event) => handlers.onEvent?.(event),
  task: (handlers, event) => handlers.onTask?.(event),
};

/**
 * The generic hop `DISPATCH[type]` cannot make inline: instantiated with a
 * single `T`, the entry's parameter and the event are the same type, whereas
 * indexing with the whole union yields signatures TypeScript refuses to call.
 */
function dispatch<T extends DeploymentStreamEvent['type']>(
  handlers: DeploymentStreamHandlers,
  type: T,
  event: DeploymentStreamEventOf<T>,
): void {
  DISPATCH[type](handlers, event);
}

/**
 * SSE delivers text, so the generated type cannot be more than an assertion
 * about what arrived. Check the discriminant the union is keyed on, which is
 * what picks the handler; the rest of each frame is taken on trust from the
 * manager's schema.
 */
function isDeploymentStreamEvent(
  value: { type?: unknown } | null,
): value is DeploymentStreamEvent {
  return typeof value?.type === 'string' && value.type in DISPATCH;
}


/**
 * @returns A function that closes the stream.
 * @description Streams a deployment's changes over server-sent events.
 *
 * The stream opens with the deployment, its active jobs and its outstanding
 * tasks, then emits changes as they happen. `EventSource` reconnects on its
 * own, and the manager re-sends that opening snapshot each time, so nothing is
 * resumed client-side and `onOpen` means "resynchronise from here" rather than
 * "started".
 *
 * Errors are reported rather than thrown: the stream keeps retrying, so a
 * caller that gave up on the first failure would lose the signal for good.
 */
export function deploymentStream(
  client: DeploymentManagerClient,
  state: DeploymentState,
  handlers: DeploymentStreamHandlers,
): DeploymentStreamSubscription {
  const { baseUrl, headers, credentials } = client.connection;
  const url = `${baseUrl}/deployments/${encodeURIComponent(state.id)}/stream`;

  const source = new EventSource(url, {
    fetch: async (input, init) =>
      fetch(input, {
        ...init,
        // Under cookie auth there are no headers to copy, so the stream has to
        // opt into sending the cookie or it authenticates as nobody.
        ...(credentials ? { credentials } : {}),
        headers: { ...init.headers, ...(await headers()) },
      }),
  });

  source.onopen = () => handlers.onOpen?.();
  source.onerror = (error) => handlers.onError?.(error);

  source.onmessage = ({ data }) => {
    // Malformed frames are ignored; the catch also swallows a handler that
    // throws, the price of keeping `parsed` inside the try.
    try {
      const parsed = JSON.parse(data);

      if (!isDeploymentStreamEvent(parsed)) return;

      dispatch(handlers, parsed.type, parsed);
    } catch {
      return;
    }
  };

  return {
    close: () => source.close(),
  };
}
