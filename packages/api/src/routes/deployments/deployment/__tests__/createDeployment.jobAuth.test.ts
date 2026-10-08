import { vi, type Mock } from 'vitest';

import { createDeployment } from '../createDeployment.js';
import * as actions from '../actions/index.js';

import type { SignerAuth } from '../../../../types.js';

const JOB = '9X4SgG88q7La2UAxioNJKD9EfYEMtYpnuLHvzUvEGDEB';
const NEW_JOB = '7ZqGkF5Lx8pR3vJm2NcY9wTbH4dE6sAu1KoQiXgVfCnB';
const NODE = '8hP5WVzxX8qQE9s6J7BkUxEsb1vQD5viiEZ1pKVXSQFH';

const node = vi.hoisted(() => ({ authParams: [] as SignerAuth[] }));

// Capture the signer each deployment hands its node API instead of reaching nodes.
vi.mock('../../../node/index.js', () => ({
  createNosanaNodeApi: ({ authParams }: { authParams: SignerAuth }) => {
    node.authParams.push(authParams);
    return () => ({ job: (address: string) => ({ address }) });
  },
}));

vi.mock('../actions/index.js', () => ({
  deploymentGenerateAuthHeader: vi.fn(async (_client, _state, query: { message: string }) =>
    `${query.message}:sig:${Date.now()}`,
  ),
  deploymentGetAllJobHeaders: vi.fn(async () => ({ [JOB]: `${JOB}:bulk-sig:${Date.now()}` })),
  deploymentGetJob: vi.fn(async () => ({ node: NODE })),
}));

vi.mock('../createVault.js', () => ({ createVault: vi.fn(() => ({})) }));

/** A fresh deployment object, as `deployments.get()` returns on every call. */
const freshDeployment = () =>
  createDeployment(global.TEST_MOCK_DEPLOYMENT, global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER, true);

/** Sign `message` the way the deployment's node API does for a node request. */
async function nodeGenerate(message: string): Promise<string> {
  await freshDeployment().getJob(JOB);
  return node.authParams.at(-1)!.generate(message);
}

describe('createDeployment node job headers', () => {
  beforeEach(() => {
    (actions.deploymentGenerateAuthHeader as Mock).mockClear();
    (actions.deploymentGetAllJobHeaders as Mock).mockClear();
  });

  it('serves node requests from the headers generateAllJobAuthHeaders stored', async () => {
    const headers = await freshDeployment().generateAllJobAuthHeaders();

    // A later deployment object for the same client reuses them.
    expect(await nodeGenerate(JOB)).toBe(headers[JOB]);
    expect(await nodeGenerate(JOB)).toBe(headers[JOB]);
    expect(actions.deploymentGetAllJobHeaders).toHaveBeenCalledTimes(1);
    expect(actions.deploymentGenerateAuthHeader).not.toHaveBeenCalled();
  });

  it('signs and stores a job the bulk headers lack (just started)', async () => {
    const header = await nodeGenerate(NEW_JOB);

    expect(await nodeGenerate(NEW_JOB)).toBe(header);
    expect(actions.deploymentGenerateAuthHeader).toHaveBeenCalledTimes(1);
    expect(actions.deploymentGenerateAuthHeader).toHaveBeenCalledWith(
      global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER.deploymentManager,
      expect.objectContaining({ id: global.TEST_MOCK_DEPLOYMENT.id }),
      { message: NEW_JOB, includeTime: 'true' },
    );
  });

  it('signs a non-job message (a terminal grant) afresh every time', async () => {
    const grant = 'nosana-terminal:v1:grant';
    await nodeGenerate(grant);
    await nodeGenerate(grant);

    expect(actions.deploymentGenerateAuthHeader).toHaveBeenCalledTimes(2);
  });
});
