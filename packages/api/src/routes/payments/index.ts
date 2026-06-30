import { errorFormatter } from '../../utils/errorFormatter.js';

import type { ClientManagerClient } from '../../client/client-manager/index.js';
import type {
  NosanaPaymentsApi,
  SetupIntentRequest,
  PaymentIntentRequest,
} from './types.js';

export * from './types.js';

export function createNosanaPaymentsApi(clients: {
  clientManager: ClientManagerClient;
}): NosanaPaymentsApi {
  const { clientManager: client } = clients;
  return {
    async listMethods(): Promise<Record<string, unknown>> {
      const { data, error } = await client.GET('/payments/methods', {});

      if (error || !data) {
        throw errorFormatter('Failed to list payment methods', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async addMethod(
      request: SetupIntentRequest,
    ): Promise<Record<string, unknown>> {
      const { data, error } = await client.POST('/payments/setup-intent', {
        body: request,
      });

      if (error || !data) {
        throw errorFormatter('Failed to add payment method', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async setDefaultMethod(id: string): Promise<Record<string, unknown>> {
      const { data, error } = await client.PUT(
        '/payments/methods/{id}/default',
        {
          params: { path: { id } },
        },
      );

      if (error || !data) {
        throw errorFormatter('Failed to set default payment method', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async deleteMethod(id: string): Promise<Record<string, unknown>> {
      const { data, error } = await client.DELETE('/payments/methods/{id}', {
        params: { path: { id } },
      });

      if (error || !data) {
        throw errorFormatter('Failed to delete payment method', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async createPaymentIntent(
      request: PaymentIntentRequest,
    ): Promise<Record<string, unknown>> {
      const { data, error } = await client.POST('/payments/payment-intent', {
        body: request,
      });

      if (error || !data) {
        throw errorFormatter('Failed to create payment intent', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async listPurchases(): Promise<Record<string, unknown>> {
      const { data, error } = await client.GET('/payments/purchases', {});

      if (error || !data) {
        throw errorFormatter('Failed to list purchases', error);
      }

      return data as unknown as Record<string, unknown>;
    },
  };
}
