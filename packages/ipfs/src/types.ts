export interface IPFSConfig {
  api: string;
  gateway: string;
  jwt?: string;
}

export type GetOverride = Omit<RequestInit, 'method'>;
export type PostOverride = Omit<RequestInit, 'method'> & Required<Pick<RequestInit, "body">>;

export type FetchClient = {
  GET: <T>(path: string, override?: GetOverride) => Promise<[T, undefined] | [undefined, Error]>;
  POST: <T>(path: string, override: PostOverride) => Promise<[T, undefined] | [undefined, Error]>;
};