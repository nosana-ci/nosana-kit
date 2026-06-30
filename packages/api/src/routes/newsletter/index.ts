import { errorFormatter } from '../../utils/errorFormatter.js';

import type { ClientManagerClient } from '../../client/client-manager/index.js';
import type {
  NosanaNewsletterApi,
  NewsletterSubscribeRequest,
} from './types.js';

export * from './types.js';

export function createNosanaNewsletterApi(clients: {
  clientManager: ClientManagerClient;
}): NosanaNewsletterApi {
  const { clientManager: client } = clients;
  return {
    async subscribe(
      request: NewsletterSubscribeRequest,
    ): Promise<Record<string, unknown>> {
      const { data, error } = await client.POST('/newsletter/subscribe', {
        body: request,
      });

      if (error || !data) {
        throw errorFormatter('Failed to subscribe to newsletter', error);
      }

      return data as unknown as Record<string, unknown>;
    },
  };
}
