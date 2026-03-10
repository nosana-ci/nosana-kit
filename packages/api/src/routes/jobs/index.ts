import { errorFormatter } from '../../utils/errorFormatter.js';

import type { BlockchainIndexerClient } from '../../client/blockchain-indexer/index.js';
import type {
  NosanaJobsApi,
  NosanaApiExtendJobRequest,
  NosanaApiExtendJobResponse,
  NosanaApiStopJobRequest,
  NosanaApiStopJobResponse,
  NosanaApiGetJobByAddressRequest,
  NosanaApiGetJobByAddressResponse,
  NosanaApiListJobRequest,
  NosanaApiListJobResponse
} from './types.js';

export * from './types.js';

export function createNosanaJobsApi(clients: { blockchainIndexer: BlockchainIndexerClient }): NosanaJobsApi {
  const { blockchainIndexer: client } = clients;
  return {
    async get(address: NosanaApiGetJobByAddressRequest): Promise<NosanaApiGetJobByAddressResponse> {
      const { data, error } = await client.GET('/api/jobs/{address}', {
        params: {
          path: {
            address
          }
        }
      });

      if (error || !data) {
        throw errorFormatter('Failed to get job', error);
      }

      return data;
    },
    async list(request: NosanaApiListJobRequest): Promise<NosanaApiListJobResponse> {
      const { data, error } = await client.POST('/api/jobs/list', {
        body: request,
      });

      if (error || !data) {
        throw errorFormatter('Failed to list job', error);
      }

      return data;
    },
    async extend({ address, ...request }: NosanaApiExtendJobRequest): Promise<NosanaApiExtendJobResponse> {
      const { data, error } = await client.POST('/api/jobs/{address}/extend', {
        params: {
          path: {
            address
          }
        },
        body: request,
      });

      if (error || !data) {
        throw errorFormatter('Failed to extend job', error);
      }

      return data;
    },
    async stop(address: NosanaApiStopJobRequest): Promise<NosanaApiStopJobResponse> {
      const { data, error } = await client.POST('/api/jobs/{address}/stop', {
        params: {
          path: {
            address
          }
        },
      });

      if (error || !data) {
        throw errorFormatter('Failed to stop job', error);
      }

      return data;
    }
  };
}

