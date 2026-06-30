import type { operations } from '../../client/client-manager/schema.js';

export type SetupIntentRequest = NonNullable<
  operations['postPaymentsSetup-intent']['requestBody']
>['content']['application/json'];
export type PaymentIntentRequest = NonNullable<
  operations['postPaymentsPayment-intent']['requestBody']
>['content']['application/json'];

export interface NosanaPaymentsApi {
  listMethods: () => Promise<Record<string, unknown>>;
  addMethod: (request: SetupIntentRequest) => Promise<Record<string, unknown>>;
  setDefaultMethod: (id: string) => Promise<Record<string, unknown>>;
  deleteMethod: (id: string) => Promise<Record<string, unknown>>;
  createPaymentIntent: (
    request: PaymentIntentRequest,
  ) => Promise<Record<string, unknown>>;
  listPurchases: () => Promise<Record<string, unknown>>;
}
