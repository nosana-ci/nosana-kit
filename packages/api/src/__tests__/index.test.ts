import { vi } from 'vitest';

import { createNosanaApi, NosanaNetwork } from '../index.js';
import { createBlockchainIndexerClient } from '../client/index.js';
import { createDeploymentsApi } from '../routes/deployments/index.js';

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
      { deploymentManager: global.TEST_MOCK_CLIENT, solana: testSignerAuth.solana },
      false
    );
  });

  test('it should create deployments API with hasApiKey=true for ApiKey', () => {
    createNosanaApi(NosanaNetwork.MAINNET, global.TEST_API_KEY, undefined);

    expect(createDeploymentsApi).toHaveBeenCalledWith({ deploymentManager: global.TEST_MOCK_CLIENT }, true);
  });
});
