import type { operations } from '../../client/client-manager/schema.js';

export type Balance =
  operations['getCreditsBalance']['responses'][200]['content']['application/json'];

export type CreditsSpendingHistoryRequest = NonNullable<
  operations['getCreditsSpending-history']['parameters']['query']
>;
export type CreditsTransactionsRequest = NonNullable<
  operations['getCreditsTransactions']['parameters']['query']
>;

export interface NosanaCreditsApi {
  balance: () => Promise<Balance>;
  claim: (code: string) => Promise<Record<string, unknown>>;
  request: () => Promise<Record<string, unknown>>;
  checkEligibility: () => Promise<Record<string, unknown>>;
  getSpendingHistory: (
    request: CreditsSpendingHistoryRequest,
  ) => Promise<Record<string, unknown>>;
  getTransactions: (
    request: CreditsTransactionsRequest,
  ) => Promise<Record<string, unknown>>;
  invitations: {
    get: (token: string) => Promise<Record<string, unknown>>;
    claim: (token: string) => Promise<Record<string, unknown>>;
  };
}
