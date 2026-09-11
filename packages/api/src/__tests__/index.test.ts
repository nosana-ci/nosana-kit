import { vi, type Mock } from 'vitest';

import { createNosanaApi, NosanaNetwork } from '../index.js';
import { createBlockchainIndexerClient } from '../client/index.js';
import { createDeploymentsApi } from '../routes/deployments/index.js';
import { createNosanaNodeApi } from '../routes/node/index.js';

// Real node API, wrapped so tests can see what auth it was built with.
vi.mock('../routes/node/index.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../routes/node/index.js')>();
  return { ...actual, createNosanaNodeApi: vi.fn(actual.createNosanaNodeApi) };
});

vi.mock('../client/index.js', () => ({
  createNosanaClientManagerApiClient: vi.fn(() => global.TEST_MOCK_CLIENT),
  createBlockchainIndexerClient: vi.fn(() => global.TEST_MOCK_CLIENT),
  createHostManagerClient: vi.fn(() => global.TEST_MOCK_CLIENT),
  createDeploymentManagerClient: vi.fn(() => global.TEST_MOCK_CLIENT),
}));

vi.mock('../routes/deployments/index.js', () => ({
  createDeploymentsApi: vi.fn(() => ({})),
}));

// Mock SignerAuth (this is what nosana-kit would pass)
const testSignerAuth = {
  identifier: 'test-address',
  generate: vi.fn(async (message: string) => `${message}:signature`),
  solana: {
    getBalance: vi.fn(),
    transferTokensToRecipient: vi.fn(),
    deserializeSignSendAndConfirmTransaction: vi.fn(),
  }
};

describe('createNosanaApi', () => {
  test('when called with SignerAuth, it should create the blockchain indexer client', () => {
    createNosanaApi(NosanaNetwork.MAINNET, testSignerAuth, undefined);

    expect(createBlockchainIndexerClient).toHaveBeenCalledWith(
      NosanaNetwork.MAINNET,
      testSignerAuth,
      undefined
    );
  });

  test('when called with ApiKey, it should create the blockchain indexer client', () => {
    createNosanaApi(NosanaNetwork.MAINNET, global.TEST_API_KEY, undefined);

    expect(createBlockchainIndexerClient).toHaveBeenCalledWith(
      NosanaNetwork.MAINNET,
      global.TEST_API_KEY,
      undefined
    );
  });

  test('when called without auth, it should create the blockchain indexer client with undefined', () => {
    createNosanaApi(NosanaNetwork.MAINNET, undefined, undefined);

    expect(createBlockchainIndexerClient).toHaveBeenCalledWith(
      NosanaNetwork.MAINNET,
      undefined,
      undefined
    );
  });

  test('when called with options, it should pass them to the clients', () => {
    createNosanaApi(NosanaNetwork.MAINNET, testSignerAuth, global.TEST_NOSANA_API_OPTIONS);

    expect(createBlockchainIndexerClient).toHaveBeenCalledWith(
      NosanaNetwork.MAINNET,
      testSignerAuth,
      global.TEST_NOSANA_API_OPTIONS
    );
  });

  test('it should create deployments API with hasApiKey=false for SignerAuth', () => {
    createNosanaApi(NosanaNetwork.MAINNET, testSignerAuth, undefined);

    expect(createDeploymentsApi).toHaveBeenCalledWith(
      {
        deploymentManager: global.TEST_MOCK_CLIENT,
        environment: NosanaNetwork.MAINNET,
        options: undefined,
        solana: testSignerAuth.solana,
      },
      false
    );
  });

  test('it should create deployments API with hasApiKey=true for ApiKey', () => {
    createNosanaApi(NosanaNetwork.MAINNET, global.TEST_API_KEY, undefined);

    expect(createDeploymentsApi).toHaveBeenCalledWith(
      { deploymentManager: global.TEST_MOCK_CLIENT, environment: NosanaNetwork.MAINNET, options: undefined },
      true
    );
  });

  test('under API key auth jobs.get reaches the node and node info is exposed (client-manager-signed)', async () => {
    (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({ data: global.TEST_MOCK_JOB, error: null });
    const api = createNosanaApi(NosanaNetwork.MAINNET, global.TEST_API_KEY, undefined);
    const job = await api.jobs.get('job');
    expect(job).toMatchObject(global.TEST_MOCK_JOB);
    expect(job.ssh).toBeDefined();
    expect('node' in api).toBe(true);
  });

  test('with SignerAuth jobs.get reaches the node and node info is exposed', async () => {
    (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({ data: global.TEST_MOCK_JOB, error: null });
    const api = createNosanaApi(NosanaNetwork.MAINNET, testSignerAuth, undefined);
    const job = await api.jobs.get('job');
    expect(job).toMatchObject(global.TEST_MOCK_JOB);
    expect(job.ssh).toBeDefined();
    expect('node' in api).toBe(true);
  });

  test('without auth jobs.get has the same shape; the node decides what it answers', async () => {
    (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({ data: global.TEST_MOCK_JOB, error: null });
    const api = createNosanaApi(NosanaNetwork.MAINNET, undefined, undefined);
    const job = await api.jobs.get('job');
    expect(job).toMatchObject(global.TEST_MOCK_JOB);
    expect(job.ssh).toBeDefined();
    expect('node' in api).toBe(true);
  });

  test('without auth or cookies the node client stays unsigned', () => {
    createNosanaApi(NosanaNetwork.MAINNET, undefined, undefined);

    const { authParams } = (createNosanaNodeApi as Mock).mock.calls.at(-1)![0];
    expect(authParams).toBeUndefined();
  });

  test('under cookie auth node requests are signed by the client manager, like API-key auth', async () => {
    (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({ data: { signature: 'sig' }, error: null });
    createNosanaApi(NosanaNetwork.MAINNET, undefined, { include_credentials: true });

    const { authParams } = (createNosanaNodeApi as Mock).mock.calls.at(-1)![0];
    await expect(authParams.generate('NosanaApiAuthentication')).resolves.toBe('NosanaApiAuthentication:sig');
    expect(global.TEST_MOCK_CLIENT.POST).toHaveBeenCalledWith(
      '/auth/sign-message/external',
      expect.objectContaining({ body: expect.objectContaining({ message: 'NosanaApiAuthentication' }) }),
    );
  });
});
