import createClient from 'openapi-fetch';

import { createNosanaDashboardApiClient } from '../index.js';
import { defaultConfig } from '../../defaults/index.js';
import { NosanaNetwork } from '../../types.js';

// SignerAuth test fixture
const testSignerAuth = {
  identifier: 'test-identifier',
  generate: async (message: string) => `${message}:test-signature`,
};

describe('createNosanaClient', () => {
  test('when called with custom backend_url option, it should use the custom URL', () => {
    createNosanaDashboardApiClient(NosanaNetwork.MAINNET, global.TEST_API_KEY, { backend_url: 'https://custom.api.com' });

    expect(createClient).toHaveBeenCalledWith({
      baseUrl: 'https://custom.api.com',
    });
  });

  test('when called with "include" credentials option, it should pass it to the client and auth middleware to be skipped', () => {
    createNosanaDashboardApiClient(NosanaNetwork.MAINNET, undefined, { include_credentials: true });

    expect(createClient).toHaveBeenCalledWith(
      expect.objectContaining({
        baseUrl: defaultConfig[NosanaNetwork.MAINNET].backend_url,
        credentials: 'include',
      })
    );

    expect(global.TEST_MOCK_CLIENT.use).not.toHaveBeenCalled();
  });

  test('when called without options, it should use the default mainnet URL', () => {
    createNosanaDashboardApiClient(NosanaNetwork.MAINNET, global.TEST_API_KEY, undefined);

    expect(createClient).toHaveBeenCalledWith({
      baseUrl: defaultConfig[NosanaNetwork.MAINNET].backend_url,
    });
  });

  test('when called with devnet environment, it should use the devnet URL', () => {
    createNosanaDashboardApiClient(NosanaNetwork.DEVNET, global.TEST_API_KEY, undefined);

    expect(createClient).toHaveBeenCalledWith({
      baseUrl: defaultConfig[NosanaNetwork.DEVNET].backend_url,
    });
  });

  it('should register the auth middleware', () => {
    createNosanaDashboardApiClient(NosanaNetwork.MAINNET, global.TEST_API_KEY, undefined);

    expect(global.TEST_MOCK_CLIENT.use).toHaveBeenCalledWith(
      expect.objectContaining({ onRequest: expect.any(Function) })
    );
  });

  test('when using API key auth, it should set Bearer token header', async () => {
    createNosanaDashboardApiClient(NosanaNetwork.MAINNET, global.TEST_API_KEY, undefined);

    const middleware = global.TEST_MOCK_CLIENT.use.mock.calls[0][0];
    const mockRequest = { headers: new Headers() };

    await middleware.onRequest({ request: mockRequest });

    expect(mockRequest.headers.get('Authorization')).toBe(`Bearer ${global.TEST_API_KEY}`);
  });

  test('when using SignerAuth, it should set x-user-id and Authorization headers', async () => {
    createNosanaDashboardApiClient(NosanaNetwork.MAINNET, testSignerAuth, undefined);

    const middleware = global.TEST_MOCK_CLIENT.use.mock.calls[0][0];
    const mockRequest = { headers: new Headers() };

    await middleware.onRequest({ request: mockRequest });

    expect(mockRequest.headers.get('x-user-id')).toBe(testSignerAuth.identifier);
    expect(mockRequest.headers.get('Authorization')).toBe('NosanaApiAuthentication:test-signature');
  });
});
