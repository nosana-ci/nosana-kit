import { isSolanaAddress } from '@nosana/types';

import { createJobRuntimeClient, jobRuntimeUrl } from '../../client/node/index.js';

import type { NodeClient } from '../../client/node/index.js';
import type { CreateNosanaApiOptions, NosanaNetwork, SignedHeaderAuth } from '../../types.js';
import type { NodeStreamSubscription } from './types.js';

/** How long a job found without a sidecar stays on its node before the sidecar is asked for again. */
export const SIDECAR_RECHECK_MS = 30_000;
/** The sidecar answers its liveness route at once; a slower answer counts as none. */
const SIDECAR_PROBE_TIMEOUT_MS = 5_000;

export interface JobRuntimeTarget {
  environment: NosanaNetwork;
  job: string;
  authParams: SignedHeaderAuth | undefined;
  options?: CreateNosanaApiOptions;
}

/**
 * Resolves the client for a job's runtime routes: the job's sidecar when its
 * node started one, otherwise the node, which serves the same routes. A node
 * on an older version, or one that could not pull the sidecar image, has none.
 * The sidecar answers `GET /` with its job address, so that is the check. A job
 * found without one is checked again after {@link SIDECAR_RECHECK_MS}, since
 * its sidecar can come up after the job is first addressed.
 */
export function createJobRuntimeResolver(target: JobRuntimeTarget, node: NodeClient): () => Promise<NodeClient> {
  if (!isSolanaAddress(target.job)) return () => Promise.resolve(node);

  let resolved: Promise<NodeClient> | undefined;
  let missingSince: number | undefined;

  return () => {
    if (!resolved || (missingSince !== undefined && Date.now() - missingSince >= SIDECAR_RECHECK_MS)) {
      missingSince = undefined;
      resolved = hasSidecar(target).then((found) => {
        if (found) {
          return createJobRuntimeClient(target.environment, target.job, target.authParams, target.options);
        }
        missingSince = Date.now();
        return node;
      });
    }
    return resolved;
  };
}

async function hasSidecar({ environment, job, options }: JobRuntimeTarget): Promise<boolean> {
  try {
    const response = await fetch(`${jobRuntimeUrl(environment, job, options)}/`, {
      signal: AbortSignal.timeout(SIDECAR_PROBE_TIMEOUT_MS),
    });
    return response.ok && (await response.json()) === job;
  } catch {
    return false;
  }
}

/**
 * Opens a stream once the runtime client is resolved. The caller still gets
 * its subscription at once; closing it before then cancels the open.
 */
export function openOnJobRuntime(
  resolve: () => Promise<NodeClient>,
  open: (client: NodeClient) => NodeStreamSubscription,
): NodeStreamSubscription {
  let closed = false;
  let subscription: NodeStreamSubscription | undefined;

  void resolve().then((client) => {
    if (!closed) subscription = open(client);
  });

  return {
    close: () => {
      closed = true;
      subscription?.close();
    },
  };
}
