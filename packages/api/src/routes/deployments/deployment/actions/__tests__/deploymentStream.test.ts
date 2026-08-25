import { Mock } from 'vitest';
import { deploymentStream } from '../deploymentStream.js';
import type { DeploymentState, DeploymentStreamEvent } from '../../../types.js';

const opened: Array<{ url: string; options: { fetch: typeof fetch } }> = [];
let source: {
  onopen: (() => void) | null;
  onerror: ((error: unknown) => void) | null;
  onmessage: ((event: { data: string }) => void) | null;
  close: Mock;
};

vi.mock('eventsource', () => ({
  // Constructed with `new`, so this cannot be an arrow function.
  EventSource: vi.fn(function (
    this: typeof source,
    url: string,
    options: { fetch: typeof fetch },
  ) {
    opened.push({ url, options });
    this.onopen = null;
    this.onerror = null;
    this.onmessage = null;
    this.close = vi.fn();
    source = this;
  }),
}));

describe('deploymentStream', () => {
  const mockClient = {
    ...global.TEST_MOCK_CLIENT,
    connection: {
      baseUrl: 'https://deployment-manager.example',
      headers: async () => ({ Authorization: 'signed', 'x-user-id': 'me' }),
    },
  };
  let mockState: DeploymentState;
  let events: DeploymentStreamEvent[];

  beforeEach(() => {
    vi.clearAllMocks();
    opened.length = 0;
    events = [];
    mockState = {
      ...global.TEST_MOCK_DEPLOYMENT,
      updated_at: new Date(global.TEST_MOCK_DEPLOYMENT.updated_at),
      created_at: new Date(global.TEST_MOCK_DEPLOYMENT.created_at),
    };
  });

  const watch = () =>
    deploymentStream(mockClient as never, mockState, {
      onDeployment: (event) => events.push(event),
      onJob: (event) => events.push(event),
      onEvent: (event) => events.push(event),
      onTask: (event) => events.push(event),
    });

  it('opens the deployment stream against the client base url', () => {
    watch();

    expect(opened[0].url).toBe(
      `https://deployment-manager.example/deployments/${mockState.id}/stream`,
    );
  });

  it('sends the headers the client would have sent', async () => {
    watch();

    const inner = vi.fn().mockResolvedValue(new Response());
    vi.stubGlobal('fetch', inner);
    await opened[0].options.fetch('https://x', { headers: { Accept: 'text/event-stream' } } as never);
    vi.unstubAllGlobals();

    expect(inner.mock.calls[0][1].headers).toEqual({
      Accept: 'text/event-stream',
      Authorization: 'signed',
      'x-user-id': 'me',
    });
  });

  it('reports the frames it reads', () => {
    watch();

    source.onmessage!({ data: '{"type":"deployment","status":"RUNNING","replicas":2,"active_revision":1}' });
    source.onmessage!({ data: '{"type":"task","id":"t","task":"STOP","status":"DONE"}' });

    expect(events).toEqual([
      { type: 'deployment', status: 'RUNNING', replicas: 2, active_revision: 1 },
      { type: 'task', id: 't', task: 'STOP', status: 'DONE' },
    ]);
  });

  it('drops frames that are unparseable or not a known frame type', () => {
    watch();

    source.onmessage!({ data: 'not json' });
    source.onmessage!({ data: '{"type":"something-else"}' });
    source.onmessage!({ data: '"a bare string"' });
    source.onmessage!({ data: '{"type":"job","job":"j","state":"QUEUED","node":null,"timeStart":0,"timeEnd":0}' });

    expect(events).toEqual([
      { type: 'job', job: 'j', state: 'QUEUED', node: null, timeStart: 0, timeEnd: 0 },
    ]);
  });

  it('routes each frame to the handler for its type', () => {
    const seen: string[] = [];
    deploymentStream(mockClient as never, mockState, {
      onDeployment: () => seen.push('deployment'),
      onJob: () => seen.push('job'),
      onEvent: () => seen.push('event'),
      onTask: () => seen.push('task'),
    });

    source.onmessage!({ data: '{"type":"task","id":"t","task":"STOP","status":"DONE"}' });
    source.onmessage!({ data: '{"type":"deployment","status":"RUNNING","replicas":1,"active_revision":1}' });
    source.onmessage!({ data: '{"type":"event","category":"Deployment","event":"X","message":"m","tx":null,"created_at":"2026-01-01T00:00:00.000Z"}' });
    source.onmessage!({ data: '{"type":"job","job":"j","state":"QUEUED","node":null,"timeStart":0,"timeEnd":0}' });

    expect(seen).toEqual(['task', 'deployment', 'event', 'job']);
  });

  it('ignores a frame whose handler was not supplied', () => {
    deploymentStream(mockClient as never, mockState, {
      onJob: (event) => events.push(event),
    });

    source.onmessage!({ data: '{"type":"deployment","status":"RUNNING","replicas":1,"active_revision":1}' });
    source.onmessage!({ data: '{"type":"job","job":"j","state":"QUEUED","node":null,"timeStart":0,"timeEnd":0}' });

    expect(events).toEqual([
      { type: 'job', job: 'j', state: 'QUEUED', node: null, timeStart: 0, timeEnd: 0 },
    ]);
  });

  it('closes the stream when stopped', () => {
    watch().close();

    expect(source.close).toHaveBeenCalledOnce();
  });

  it('swallows a throwing handler and keeps delivering later frames', () => {
    let calls = 0;
    deploymentStream(mockClient as never, mockState, {
      onJob: () => {
        calls += 1;
        throw new Error('caller bug');
      },
    });

    const frame = {
      data: '{"type":"job","job":"j","state":"QUEUED","node":null,"timeStart":0,"timeEnd":0}',
    };

    expect(() => source.onmessage!(frame)).not.toThrow();
    expect(() => source.onmessage!(frame)).not.toThrow();
    expect(calls).toBe(2);
  });
});
