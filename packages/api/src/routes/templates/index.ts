import { errorFormatter } from '../../utils/errorFormatter.js';

import type { ClientManagerClient } from '../../client/client-manager/index.js';
import type { NosanaTemplatesApi, Template } from './types.js';

export * from './types.js';

export function createNosanaTemplatesApi(clients: {
  clientManager: ClientManagerClient;
}): NosanaTemplatesApi {
  const { clientManager: client } = clients;
  return {
    async list(): Promise<Template[]> {
      const { data, error } = await client.GET('/templates/', {});

      if (error || !data) {
        throw errorFormatter('Failed to list templates', error);
      }

      return data;
    },
    async getAllGrouped(): Promise<Record<string, unknown>> {
      const { data, error } = await client.GET('/templates/grouped', {});

      if (error || !data) {
        throw errorFormatter('Failed to get grouped templates', error);
      }

      return data;
    },
    async get(id: string): Promise<Template> {
      const { data, error } = await client.GET('/templates/{id}', {
        params: {
          path: { id },
        },
      });

      if (error || !data) {
        throw errorFormatter('Failed to get template', error);
      }

      return data;
    },
    async getVariant(id: string, variantId: string): Promise<Template> {
      const { data, error } = await client.GET('/templates/{id}/{variantId}', {
        params: {
          path: { id, variantId },
        },
      });

      if (error || !data) {
        throw errorFormatter('Failed to get template variant', error);
      }

      return data;
    },
  };
}
