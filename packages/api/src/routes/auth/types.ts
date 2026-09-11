import type { paths } from '../../client/client-manager/schema.js';

export type ValidateSessionResponse = paths['/auth/validate-session']['post']['responses'][200]['content']['application/json'];
export type ValidateApiKeyResponse = paths['/auth/validate-api-key']['post']['responses'][200]['content']['application/json'];

export type NosanaAuthApi = {
  signMessage: (message: string, options?: { includeTime?: boolean }) => Promise<string>;
  /**
   * Signs `message` and returns it as a Nosana `authorization` header
   * (`message:signature[:timestamp]`), the form a node verifies against the job
   * owner. Lets an API-key caller reach a node without a local wallet.
   */
  signHeader: (message: string, options?: { includeTime?: boolean }) => Promise<string>;
  validateSession: (cookieHeader?: string) => Promise<ValidateSessionResponse>;
  validateApiKey: (apiKey: string) => Promise<ValidateApiKeyResponse>;
}