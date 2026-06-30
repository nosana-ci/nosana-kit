import type { FetchClient, GetOverride, IPFSConfig, PostOverride } from "../types.js";

function buildRequestInit(config: IPFSConfig, path: string, override: RequestInit): Request {
  const request: Request = new Request((override.method === "GET" ? config.gateway : config.api) + path, {
    ...override
  });

  if (config.jwt) {
    request.headers.append("Authorization", `Bearer ${config.jwt}`);
  }
  return request;
};

export function createIPFSFetchClient(config: IPFSConfig): FetchClient {
  const fetchFn = async <T>(path: string, override: RequestInit): Promise<[T, undefined] | [undefined, Error]> => {
    const request = buildRequestInit(config, path, override);

    try {
      const response = await fetch(request);

      if (!response.ok) {
        throw new Error(`Failed to fetch data from IPFS: ${response.status} ${response.statusText} ${await response.text()}`);
      }

      if (response.headers.get('content-type')?.includes('application/json')) {
        return [await response.json() as T, undefined] as [T, undefined];
      }

      const text = await response.text();
      return [text as unknown as T, undefined] as [T, undefined];
    } catch (error) {
      return [undefined, error as Error] as [undefined, Error];
    }
  }

  return {
    GET: async <T>(path: string, override?: GetOverride) => await fetchFn<T>(path, { ...override, method: 'GET' }),
    POST: async <T>(path: string, override: PostOverride) => await fetchFn<T>(path, { ...override, method: 'POST' })
  }
}