import { vi } from 'vitest';

import { createNosanaApi, NosanaNetwork } from '../index.js';
import { createNosanaDashboardApiClient } from '../client/index.js';
import { createDeploymentsApi } from '../routes/deployments/index.js';

vi.mock('../client/index.js', () => ({
  createNosanaDashboardApiClient: vi.fn(() => global.TEST_MOCK_CLIENT),
  createNosanaClientManagerApiClient: vi.fn(() => global.TEST_MOCK_CLIENT),
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
  test('when called with SignerAuth, it should pass it to the client', () => {
    createNosanaApi(NosanaNetwork.MAINNET, testSignerAuth, undefined);

    expect(createNosanaDashboardApiClient).toHaveBeenCalledWith(
      NosanaNetwork.MAINNET,
      testSignerAuth,
      undefined
    );
  });

  test('when called with ApiKey, it should pass it to the client', () => {
    createNosanaApi(NosanaNetwork.MAINNET, global.TEST_API_KEY, undefined);

    expect(createNosanaDashboardApiClient).toHaveBeenCalledWith(
      NosanaNetwork.MAINNET,
      global.TEST_API_KEY,
      undefined
    );
  });

  test('when called without auth, it should pass undefined to the client', () => {
    createNosanaApi(NosanaNetwork.MAINNET, undefined, undefined);

    expect(createNosanaDashboardApiClient).toHaveBeenCalledWith(
      NosanaNetwork.MAINNET,
      undefined,
      undefined
    );
  });

  test('when called with options, it should pass them to the client', () => {
    createNosanaApi(NosanaNetwork.MAINNET, testSignerAuth, global.TEST_NOSANA_API_OPTIONS);

    expect(createNosanaDashboardApiClient).toHaveBeenCalledWith(
      NosanaNetwork.MAINNET,
      testSignerAuth,
      global.TEST_NOSANA_API_OPTIONS
    );
  });

  test('it should create deployments API with hasApiKey=false for SignerAuth', () => {
    createNosanaApi(NosanaNetwork.MAINNET, testSignerAuth, undefined);

    expect(createDeploymentsApi).toHaveBeenCalledWith(
      { client: global.TEST_MOCK_CLIENT, solana: testSignerAuth.solana },
      false
    );
  });

  test('it should create deployments API with hasApiKey=true for ApiKey', () => {
    createNosanaApi(NosanaNetwork.MAINNET, global.TEST_API_KEY, undefined);

    expect(createDeploymentsApi).toHaveBeenCalledWith({ client: global.TEST_MOCK_CLIENT }, true);
  });
});
