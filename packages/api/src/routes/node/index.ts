import { createNodeClient, nodeDomain } from '../../client/node/index.js';
import { nodeInfo } from './actions/nodeInfo.js';
import { createNodeJob } from './createNodeJob.js';

import type { SignedHeaderAuth } from '../../types.js';
import type { NodeApi, NodeRouteDeps, NosanaNodeApi } from './types.js';

export type * from './types.js';

/**
 * Talks to nodes directly. Each node runs the same API on its own host, checks
 * the job owner's wallet signature, and knows only about the jobs it runs.
 */
export function createNosanaNodeApi({ environment, authParams, options }: NodeRouteDeps): NosanaNodeApi {
  const domain = nodeDomain(environment, options);
  const authorize = authParams?.generate;

  return (address): NodeApi => {
    const client = createNodeClient(environment, address, authParams, options);

    return {
      address,
      url: client.connection.baseUrl,
      info: () => nodeInfo(client),
      job: (job) => {
        // The node verifies the owner's signature over the job address, so a
        // job's client signs that address as its message: the header is bound
        // to this job and cannot be replayed against another. skipCache because
        // the signer's store keys by identifier, not message.
        const jobAuth: SignedHeaderAuth | undefined = authParams && {
          ...authParams,
          generate: () => authParams.generate(job, { skipCache: true }),
        };
        return createNodeJob({
          client: createNodeClient(environment, address, jobAuth, options),
          environment,
          domain,
          authorize,
          node: address,
          job,
        });
      },
    };
  };
}
