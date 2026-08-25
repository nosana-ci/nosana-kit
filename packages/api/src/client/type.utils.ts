import createClient from "openapi-fetch";

export type EnumValues<T> = T[keyof T];

/**
 * Utility type that relaxes header *requirements* on OpenAPI parameters: auth
 * headers (Authorization/x-user-id) are injected by the client middleware, so
 * callers must never be forced to pass them. We make the whole `header` bag
 * optional rather than removing it, so typed request headers the caller does
 * supply (e.g. `Idempotency-Key`) still flow through. Responses and requestBody
 * are left untouched.
 */
type OmitHeaders<T> = T extends {
  parameters: {
    header?: infer Header;
    path?: infer Path;
    query?: infer Query;
    cookie?: infer Cookie;
  };
  responses?: infer Responses;
  requestBody?: infer RequestBody;
}
  ? {
    parameters: {
      header?: Header;
    } & (Path extends undefined ? {} : { path: Path }) &
    (Query extends undefined ? {} : { query: Query }) &
    (Cookie extends undefined ? {} : { cookie: Cookie });
  } & (Responses extends undefined ? {} : { responses: Responses }) &
  (RequestBody extends undefined ? {} : { requestBody: RequestBody })
  : T;

/**
 * Type that removes header requirements from all endpoints in the paths
 * This should preserve response types and other properties
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AuthenticatedPaths<Paths extends Record<string, any>> = {
  [P in keyof Paths]: {
    [M in keyof Paths[P]]: OmitHeaders<Paths[P][M]>;
  };
};

/**
 * What opening a connection openapi-fetch cannot model — a server-sent event
 * stream — needs in order to be addressed and authenticated the same way every
 * ordinary request is.
 */
export type ClientConnection = {
  baseUrl: string;
  headers: () => Promise<Record<string, string>>;
};

/**
 * Explicit client type that should preserve all response typing
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AuthenticatedClient<Paths extends Record<string, any>> = ReturnType<
  typeof createClient<AuthenticatedPaths<Paths>>
>;

