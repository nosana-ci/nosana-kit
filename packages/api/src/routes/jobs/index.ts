import { errorFormatter } from '../../utils/errorFormatter.js';

import type { QueryClient } from '../../client/index.js';
import type {
  NosanaJobsApi,
  NosanaJobActionOptions,
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

/**
 * Builds the optional request init that carries the `Idempotency-Key` header.
 * Returns an empty object when no key is supplied so the request is unchanged.
 */
function idempotencyInit({ idempotencyKey }: NosanaJobActionOptions = {}) {
  return idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey } } : {};
}

export function createNosanaJobsApi(client: QueryClient): NosanaJobsApi {
  return {
    async get(address: NosanaApiGetJobByAddressRequest): Promise<NosanaApiGetJobByAddressResponse> {
      const { data, error, response } = await client.GET('/api/jobs/{address}', {
        params: {
          path: {
            address
          }
        }
      });

      if (error || !data) {
        throw errorFormatter('Failed to get job', error, response);
      }

      return data;
    },
    async list(request: NosanaApiListJobRequest, options?: NosanaJobActionOptions): Promise<NosanaApiListJobResponse> {
      const { data, error, response } = await client.POST('/api/jobs/list', {
        body: request,
        ...idempotencyInit(options),
      });

      if (error || !data) {
        throw errorFormatter('Failed to list job', error, response);
      }

      return data;
    },
    async extend({ address, ...request }: NosanaApiExtendJobRequest, options?: NosanaJobActionOptions): Promise<NosanaApiExtendJobResponse> {
      const { data, error, response } = await client.POST('/api/jobs/{address}/extend', {
        params: {
          path: {
            address
          }
        },
        body: request,
        ...idempotencyInit(options),
      });

      if (error || !data) {
        throw errorFormatter('Failed to extend job', error, response);
      }

      return data;
    },
    async stop(address: NosanaApiStopJobRequest, options?: NosanaJobActionOptions): Promise<NosanaApiStopJobResponse> {
      const { data, error, response } = await client.POST('/api/jobs/{address}/stop', {
        params: {
          path: {
            address
          }
        },
        ...idempotencyInit(options),
      });

      if (error || !data) {
        throw errorFormatter('Failed to stop job', error, response);
      }

      return data;
    }
  };
}

