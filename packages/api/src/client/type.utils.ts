import createClient from "openapi-fetch";

export type EnumValues<T> = T[keyof T];

/**
 * Utility type to remove header requirements from OpenAPI parameters
 * This preserves the original structure but removes headers and makes undefined params optional
 * We only modify the parameters, leaving responses and requestBody untouched
 */
type OmitHeaders<T> = T extends {
  parameters: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    header?: any;
    path?: infer Path;
    query?: infer Query;
    cookie?: infer Cookie;
  };
  responses?: infer Responses;
  requestBody?: infer RequestBody;
}
  ? {
    parameters: {
      header?: never;
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
 * Explicit client type that should preserve all response typing
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AuthenticatedClient<Paths extends Record<string, any>> = ReturnType<
  typeof createClient<AuthenticatedPaths<Paths>>
>;

