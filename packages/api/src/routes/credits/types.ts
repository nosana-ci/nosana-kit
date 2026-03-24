import type { components } from '../../client/client-manager/schema.js';

export type Balance = components['schemas']['CreditBalance'];

export interface NosanaCreditsApi {
  balance: () => Promise<Balance>;
  claim: (code: string) => Promise<Record<string, unknown>>;
  request: () => Promise<Record<string, unknown>>;
  checkEligibility: () => Promise<Record<string, unknown>>;
  invitations: {
    get: (token: string) => Promise<Record<string, unknown>>;
    claim: (token: string) => Promise<Record<string, unknown>>;
  };
}
