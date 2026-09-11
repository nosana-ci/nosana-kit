import { Mock } from 'vitest';
import { JOB, NODE, nodeApi } from './fixtures.js';

const opened: Array<{ url: string; options: { fetch: typeof fetch } }> = [];
let source: {
  onopen: (() => void) | null;
  onerror: ((error: unknown) => void) | null;
  onmessage: ((event: { data: string }) => void) | null;
  close: Mock;
};

vi.mock('eventsource', () => ({
  EventSource: vi.fn(function (this: typeof source, url: string, options: { fetch: typeof fetch }) {
    opened.push({ url, options });
    this.onopen = null;
    this.onerror = null;
    this.onmessage = null;
    this.close = vi.fn();
    source = this;
  }),
}));

const job = () => nodeApi().job(JOB);

describe('node job streams', () => {
  beforeEach(() => {
    opened.length = 0;
  });

  it('opens the info stream on the node with the signed headers', async () => {
    const frames: unknown[] = [];
    const subscription = job().streamInfo({ onData: (data) => frames.push(data) });

    expect(opened[0].url).toBe(`https://${NODE}.node.k8s.dev.nos.ci/job/${JOB}/info`);

    const inner = vi.fn().mockResolvedValue(new Response());
    vi.stubGlobal('fetch', inner);
    await opened[0].options.fetch('https://x', { headers: { accept: 'text/event-stream' } });
    expect(inner.mock.calls[0][1].headers).toMatchObject({
      accept: 'text/event-stream',
      Authorization: 'NosanaApiAuthentication:signed',
      'x-user-id': 'me',
    });
    vi.unstubAllGlobals();

    source.onmessage?.({ data: JSON.stringify({ status: 'running', opStates: [] }) });
    source.onmessage?.({ data: 'garbage' });
    expect(frames).toEqual([{ status: 'running', opStates: [] }]);

    subscription.close();
    expect(source.close).toHaveBeenCalled();
  });

  it('opens the stats stream with the sampling interval', () => {
    job().streamStats({ onData: vi.fn() }, { interval: 2 });
    expect(opened[0].url).toBe(`https://${NODE}.node.k8s.dev.nos.ci/job/${JOB}/stats/stream?interval=2`);
  });
});
