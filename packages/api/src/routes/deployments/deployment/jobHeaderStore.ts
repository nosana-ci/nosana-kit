/**
 * Nodes accept a timestamped job header for this long (the `validate` default
 * in @nosana/authorization).
 */
export const NODE_HEADER_VALIDITY_MS = 300_000;

/** Headers stop being served this long before the node would reject them, to absorb clock skew. */
export const HEADER_REFRESH_MARGIN_MS = 60_000;

export type JobHeaderStore = {
  /** The job's header while the node will still accept it. */
  get: (job: string) => string | undefined;
  set: (job: string, header: string) => void;
};

/**
 * When a header stops being served: its signing timestamp plus the node's
 * validity window, less the refresh margin. A header without a timestamp never
 * expires on the node, so it is kept for the same window from when it was stored.
 */
export function headerExpiresAt(header: string, storedAt: number): number {
  // `message:signature[:timestamp]`; a job address message holds no separator.
  const parts = header.split(':');
  const timestamp = parts.length >= 3 ? Number(parts[parts.length - 1]) : NaN;
  const signedAt = Number.isFinite(timestamp) && timestamp > 0 ? timestamp : storedAt;
  return signedAt + NODE_HEADER_VALIDITY_MS - HEADER_REFRESH_MARGIN_MS;
}

export function createJobHeaderStore(now: () => number = Date.now): JobHeaderStore {
  const headers = new Map<string, { header: string; expiresAt: number }>();
  return {
    get: (job) => {
      const entry = headers.get(job);
      return entry && entry.expiresAt > now() ? entry.header : undefined;
    },
    set: (job, header) => {
      headers.set(job, { header, expiresAt: headerExpiresAt(header, now()) });
    },
  };
}

/**
 * Stores outlive the deployment objects that use them: callers commonly
 * re-fetch a deployment (`deployments.get`) while its jobs keep streaming, so a
 * store is kept per shared deployment-manager client and deployment id.
 */
const stores = new WeakMap<object, Map<string, JobHeaderStore>>();

export function jobHeaderStoreFor(client: object, deploymentId: string): JobHeaderStore {
  let byDeployment = stores.get(client);
  if (!byDeployment) {
    byDeployment = new Map();
    stores.set(client, byDeployment);
  }
  let store = byDeployment.get(deploymentId);
  if (!store) {
    store = createJobHeaderStore();
    byDeployment.set(deploymentId, store);
  }
  return store;
}
