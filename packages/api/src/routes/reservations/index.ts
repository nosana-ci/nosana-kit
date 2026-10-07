import { errorFormatter } from '../../utils/errorFormatter.js';

import type { HostManagerClient } from '../../client/host-manager/index.js';
import type {
  NosanaAvailableNodes,
  NosanaAvailableNodesRequest,
  NosanaGpuModels,
  NosanaRequirementOptions,
  NosanaRequirementOptionsRequest,
  NosanaReservationsApi,
} from './types.js';

export * from './types.js';

/**
 * host-manager's public reservation lookups: the GPU catalogue, the
 * requirement options and which hosts meet a set of requirements. Creating a
 * reservation is not here; only the deployment manager may do that.
 */
export function createNosanaReservationsApi(clients: {
  hostManager: HostManagerClient;
}): NosanaReservationsApi {
  const { hostManager: client } = clients;
  return {
    async listGpus(): Promise<NosanaGpuModels> {
      const { data, error, response } = await client.GET(
        '/reservations/gpus',
        {},
      );

      if (error || !data) {
        throw errorFormatter('Failed to fetch GPU models', error, response);
      }

      return data;
    },
    async getRequirementOptions(
      request: NosanaRequirementOptionsRequest = {},
    ): Promise<NosanaRequirementOptions> {
      const { data, error, response } = await client.POST(
        '/reservations/requirements',
        { body: request },
      );

      if (error || !data) {
        throw errorFormatter(
          'Failed to fetch requirement options',
          error,
          response,
        );
      }

      return data;
    },
    async findAvailable(
      request: NosanaAvailableNodesRequest = {},
    ): Promise<NosanaAvailableNodes> {
      const { data, error, response } = await client.POST(
        '/reservations/available',
        { body: request },
      );

      if (error || !data) {
        throw errorFormatter('Failed to find available nodes', error, response);
      }

      return data;
    },
  };
}
