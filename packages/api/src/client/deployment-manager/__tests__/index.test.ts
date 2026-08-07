import createClient from 'openapi-fetch';

import { createDeploymentManagerClient } from '../index.js';
import { defaultConfig } from '../../../defaults/index.js';
import { NosanaNetwork } from '../../../types.js';

const testSignerAuth = {
  identifier: 'test-identifier',
  generate: async (message: string) => `${message}:test-signature`,
  solana: global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER.solana,
};

describe('createDeploymentManagerClient', () => {
  describe('with API key auth', () => {
    test('it should route through the client manager proxy', () => {
      createDeploymentManagerClient(
        NosanaNetwork.MAINNET,
        global.TEST_API_KEY,
        undefined,
      );

      expect(createClient).toHaveBeenCalledWith({
        baseUrl: defaultConfig[NosanaNetwork.MAINNET].client_manager_url,
      });
    });

    test('it should honour a custom client_manager_url', () => {
      createDeploymentManagerClient(NosanaNetwork.MAINNET, global.TEST_API_KEY, {
        client_manager_url: 'https://custom-cm.api.com',
      });

      expect(createClient).toHaveBeenCalledWith({
        baseUrl: 'https://custom-cm.api.com',
      });
    });

    test('it should forward a custom deployment_manager_url as a proxy target override', () => {
      createDeploymentManagerClient(NosanaNetwork.MAINNET, global.TEST_API_KEY, {
        deployment_manager_url: 'https://custom-dm.api.com',
      });

      expect(createClient).toHaveBeenCalledWith({
        baseUrl: defaultConfig[NosanaNetwork.MAINNET].client_manager_url,
        headers: { 'x-deployment-manager-url': 'https://custom-dm.api.com' },
      });
    });

    test('it should still send the API key as a bearer token', async () => {
      createDeploymentManagerClient(
        NosanaNetwork.MAINNET,
        global.TEST_API_KEY,
        undefined,
      );

      const middleware = global.TEST_MOCK_CLIENT.use.mock.calls[0][0];
      const mockRequest = { headers: new Headers() };

      await middleware.onRequest({ request: mockRequest });

      expect(mockRequest.headers.get('Authorization')).toBe(
        `Bearer ${global.TEST_API_KEY}`,
      );
    });
  });

  describe('with signer auth', () => {
    test('it should talk to the deployment manager directly', () => {
      createDeploymentManagerClient(
        NosanaNetwork.MAINNET,
        testSignerAuth,
        undefined,
      );

      expect(createClient).toHaveBeenCalledWith({
        baseUrl: defaultConfig[NosanaNetwork.MAINNET].deployment_manager_url,
      });
    });

    test('it should honour a custom deployment_manager_url', () => {
      createDeploymentManagerClient(NosanaNetwork.DEVNET, testSignerAuth, {
        deployment_manager_url: 'https://custom-dm.api.com',
      });

      expect(createClient).toHaveBeenCalledWith({
        baseUrl: 'https://custom-dm.api.com',
      });
    });
  });

  describe('without auth', () => {
    test('it should talk to the deployment manager directly', () => {
      createDeploymentManagerClient(NosanaNetwork.DEVNET, undefined, undefined);

      expect(createClient).toHaveBeenCalledWith({
        baseUrl: defaultConfig[NosanaNetwork.DEVNET].deployment_manager_url,
      });
    });
  });
});
