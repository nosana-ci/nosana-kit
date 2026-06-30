import createClient from 'openapi-fetch';

import { createBlockchainIndexerClient } from '../blockchain-indexer/index.js';
import { defaultConfig } from '../../defaults/index.js';
import { NosanaNetwork } from '../../types.js';

// SignerAuth test fixture
const testSignerAuth = {
  identifier: 'test-identifier',
  generate: async (message: string) => `${message}:test-signature`,
};

describe('createBlockchainIndexerClient', () => {
  test('when called with custom blockchain_indexer_url option, it should use the custom URL', () => {
    createBlockchainIndexerClient(NosanaNetwork.MAINNET, global.TEST_API_KEY, { blockchain_indexer_url: 'https://custom.api.com' });

    expect(createClient).toHaveBeenCalledWith({
      baseUrl: 'https://custom.api.com',
    });
  });

  test('when called with "include" credentials option, it should pass it to the client and auth middleware to be skipped', () => {
    createBlockchainIndexerClient(NosanaNetwork.MAINNET, undefined, { include_credentials: true });

    expect(createClient).toHaveBeenCalledWith(
      expect.objectContaining({
        baseUrl: defaultConfig[NosanaNetwork.MAINNET].blockchain_indexer_url,
        credentials: 'include',
      })
    );

    expect(global.TEST_MOCK_CLIENT.use).not.toHaveBeenCalled();
  });

  test('when called without options, it should use the default mainnet URL', () => {
    createBlockchainIndexerClient(NosanaNetwork.MAINNET, global.TEST_API_KEY, undefined);

    expect(createClient).toHaveBeenCalledWith({
      baseUrl: defaultConfig[NosanaNetwork.MAINNET].blockchain_indexer_url,
    });
  });

  test('when called with devnet environment, it should use the devnet URL', () => {
    createBlockchainIndexerClient(NosanaNetwork.DEVNET, global.TEST_API_KEY, undefined);

    expect(createClient).toHaveBeenCalledWith({
      baseUrl: defaultConfig[NosanaNetwork.DEVNET].blockchain_indexer_url,
    });
  });

  it('should register the auth middleware', () => {
    createBlockchainIndexerClient(NosanaNetwork.MAINNET, global.TEST_API_KEY, undefined);

    expect(global.TEST_MOCK_CLIENT.use).toHaveBeenCalledWith(
      expect.objectContaining({ onRequest: expect.any(Function) })
    );
  });

  test('when using API key auth, it should set Bearer token header', async () => {
    createBlockchainIndexerClient(NosanaNetwork.MAINNET, global.TEST_API_KEY, undefined);

    const middleware = global.TEST_MOCK_CLIENT.use.mock.calls[0][0];
    const mockRequest = { headers: new Headers() };

    await middleware.onRequest({ request: mockRequest });

    expect(mockRequest.headers.get('Authorization')).toBe(`Bearer ${global.TEST_API_KEY}`);
  });

  test('when using SignerAuth, it should set x-user-id and Authorization headers', async () => {
    createBlockchainIndexerClient(NosanaNetwork.MAINNET, testSignerAuth, undefined);

    const middleware = global.TEST_MOCK_CLIENT.use.mock.calls[0][0];
    const mockRequest = { headers: new Headers() };

    await middleware.onRequest({ request: mockRequest });

    expect(mockRequest.headers.get('x-user-id')).toBe(testSignerAuth.identifier);
    expect(mockRequest.headers.get('Authorization')).toBe('NosanaApiAuthentication:test-signature');
  });
});
