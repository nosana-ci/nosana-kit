import {
  createJobHeaderStore,
  headerExpiresAt,
  jobHeaderStoreFor,
  HEADER_REFRESH_MARGIN_MS,
  NODE_HEADER_VALIDITY_MS,
} from '../jobHeaderStore.js';

const T0 = 1_800_000_000_000;
const LIFETIME = NODE_HEADER_VALIDITY_MS - HEADER_REFRESH_MARGIN_MS;

describe('headerExpiresAt', () => {
  it('expires a timestamped header a margin before the node rejects it', () => {
    expect(headerExpiresAt(`job:sig:${T0}`, T0 + 5_000)).toBe(T0 + LIFETIME);
  });

  it('keeps an untimestamped header for the same window from when it was stored', () => {
    expect(headerExpiresAt('job:123456789', T0)).toBe(T0 + LIFETIME);
  });
});

describe('createJobHeaderStore', () => {
  it('serves a header until shortly before the node would reject it', () => {
    let clock = T0;
    const store = createJobHeaderStore(() => clock);
    store.set('job-a', `job-a:sig:${T0}`);

    clock += LIFETIME - 1;
    expect(store.get('job-a')).toBe(`job-a:sig:${T0}`);
    clock += 1;
    expect(store.get('job-a')).toBeUndefined();
  });

  it('keeps one header per job', () => {
    const store = createJobHeaderStore(() => T0);
    store.set('job-a', `job-a:sig:${T0}`);

    expect(store.get('job-a')).toBe(`job-a:sig:${T0}`);
    expect(store.get('job-b')).toBeUndefined();
  });
});

describe('jobHeaderStoreFor', () => {
  it('shares a store per client and deployment across deployment objects', () => {
    const client = {};
    const store = jobHeaderStoreFor(client, 'dep-1');

    expect(jobHeaderStoreFor(client, 'dep-1')).toBe(store);
    expect(jobHeaderStoreFor(client, 'dep-2')).not.toBe(store);
    expect(jobHeaderStoreFor({}, 'dep-1')).not.toBe(store);
  });
});
