import { Mock } from 'vitest';
import { createDeploymentsApi } from '../index.js';

describe('createDeploymentsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  describe('create', () => {
    it('should return the created deployment', async () => {
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({ data: global.TEST_MOCK_DEPLOYMENT, error: null });

      const api = createDeploymentsApi({ deploymentManager: global.TEST_MOCK_CLIENT }, true);
      const result = await api.create(global.TEST_CREATE_DEPLOYMENT_REQUEST);

      expect(result.id).toBe('8hP5WVzxX8qQE9s6J7BkUxEsb1vQD5viiEZ1pKVXSQFH');
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({ data: null, error: { message: 'Invalid deployment' } });

      const api = createDeploymentsApi({ deploymentManager: global.TEST_MOCK_CLIENT }, true);

      await expect(api.create(global.TEST_CREATE_DEPLOYMENT_REQUEST)).rejects.toThrow('Error creating deployment');
    });
  });

  describe('get', () => {
    it('should return the deployment', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({ data: global.TEST_MOCK_DEPLOYMENT, error: null });

      const api = createDeploymentsApi({ deploymentManager: global.TEST_MOCK_CLIENT }, true);
      const result = await api.get('8hP5WVzxX8qQE9s6J7BkUxEsb1vQD5viiEZ1pKVXSQFH');

      expect(result.id).toBe('8hP5WVzxX8qQE9s6J7BkUxEsb1vQD5viiEZ1pKVXSQFH');
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({ data: null, error: { message: 'Not found' } });

      const api = createDeploymentsApi({ deploymentManager: global.TEST_MOCK_CLIENT }, true);

      await expect(api.get('invalid')).rejects.toThrow('Error getting deployment');
    });
  });

  describe('list', () => {
    it('should return list of deployments', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({ data: global.TEST_MOCK_DEPLOYMENTS_LIST, error: null });

      const api = createDeploymentsApi({ deploymentManager: global.TEST_MOCK_CLIENT }, true);
      const result = await api.list();

      expect(result.deployments).toHaveLength(1);
      expect(result.deployments[0].id).toBe('8hP5WVzxX8qQE9s6J7BkUxEsb1vQD5viiEZ1pKVXSQFH');
      expect(result.total_items).toBeDefined();
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({ data: null, error: { message: 'Server error' } });

      const api = createDeploymentsApi({ deploymentManager: global.TEST_MOCK_CLIENT }, true);

      await expect(api.list()).rejects.toThrow('Error listing deployments');
    });
  });

  describe('pipe', () => {
    it('should execute actions on existing deployment', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({ data: global.TEST_MOCK_DEPLOYMENT, error: null });

      const api = createDeploymentsApi({ deploymentManager: global.TEST_MOCK_CLIENT }, true);
      const mockAction = vi.fn();

      const result = await api.pipe('8hP5WVzxX8qQE9s6J7BkUxEsb1vQD5viiEZ1pKVXSQFH', mockAction);

      expect(mockAction).toHaveBeenCalledWith(expect.objectContaining({ id: '8hP5WVzxX8qQE9s6J7BkUxEsb1vQD5viiEZ1pKVXSQFH' }));
      expect(result.id).toBe('8hP5WVzxX8qQE9s6J7BkUxEsb1vQD5viiEZ1pKVXSQFH');
    });

    it('should create and execute actions on new deployment', async () => {
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({ data: global.TEST_MOCK_DEPLOYMENT, error: null });

      const api = createDeploymentsApi({ deploymentManager: global.TEST_MOCK_CLIENT }, true);
      const mockAction = vi.fn();

      const result = await api.pipe(global.TEST_CREATE_DEPLOYMENT_REQUEST, mockAction);

      expect(mockAction).toHaveBeenCalled();
      expect(result.id).toBe('8hP5WVzxX8qQE9s6J7BkUxEsb1vQD5viiEZ1pKVXSQFH');
    });
  });

  describe('vaults', () => {
    describe('create', () => {
      test('when signer auth is present, it should create a vault', async () => {
        (global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER.deploymentManager.POST as Mock).mockResolvedValue({
          data: global.TEST_MOCK_VAULT,
          error: null,
        });

        const api = createDeploymentsApi(global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER, false);
        const result = await api.vaults.create();

        expect(result.address).toBe(global.TEST_MOCK_VAULT.vault);
        expect(result.created_at).toBeInstanceOf(Date);
        expect(global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER.deploymentManager.POST).toHaveBeenCalledWith(
          '/api/deployments/vaults/create',
          {},
        );
      });

      test('when hasApiKey is true, it should not return vaults', async () => {
        const api = createDeploymentsApi({ deploymentManager: global.TEST_MOCK_CLIENT }, true);

        expect(api).not.toHaveProperty('vaults');
      });

      test('when solana not in options, it should throw error', async () => {
        const api = createDeploymentsApi({ deploymentManager: global.TEST_MOCK_CLIENT }, false);

        expect(api.vaults).toBeDefined();
        await expect(api.vaults.create()).rejects.toThrow(
          'Creating a vault requires signer authentication',
        );
      });

      test('when api returns error, it should throw formatted error', async () => {
        (global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER.deploymentManager.POST as Mock).mockResolvedValue({
          data: null,
          error: { message: 'Server error' },
        });

        const api = createDeploymentsApi(global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER, false);

        await expect(api.vaults.create()).rejects.toThrow('Error creating vault');
      });

      test('when api returns no data, it should throw formatted error', async () => {
        (global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER.deploymentManager.POST as Mock).mockResolvedValue({
          data: null,
          error: null,
        });

        const api = createDeploymentsApi(global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER, false);

        await expect(api.vaults.create()).rejects.toThrow('Error creating vault');
      });
    });

    describe('list', () => {
      test('when signer auth is present, it should list vaults', async () => {
        (global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER.deploymentManager.GET as Mock).mockResolvedValue({
          data: global.TEST_MOCK_VAULTS_LIST,
          error: null,
        });

        const api = createDeploymentsApi(global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER, false);
        const result = await api.vaults.list();

        // Assert that the SDK maps the raw response (vault) to Vault objects (address)
        const expectedAddresses = global.TEST_MOCK_VAULTS_LIST.map((vault) => vault.vault);
        const resultAddresses = result.map((vault) => vault.address);

        expect(resultAddresses).toEqual(expectedAddresses);
        result.forEach((vault) => {
          expect(vault.created_at).toBeInstanceOf(Date);
        });

        expect(global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER.deploymentManager.GET).toHaveBeenCalledWith(
          '/api/deployments/vaults',
          {},
        );
      });

      test('when hasApiKey is true, it should not return vaults', async () => {
        const api = createDeploymentsApi({ deploymentManager: global.TEST_MOCK_CLIENT }, true);

        expect(api).not.toHaveProperty('vaults');
      });

      test('when solana not in options, it should throw error', async () => {
        const api = createDeploymentsApi({ deploymentManager: global.TEST_MOCK_CLIENT }, false);

        expect(api.vaults).toBeDefined();
        await expect(api.vaults.list()).rejects.toThrow(
          'Creating a vault requires signer authentication',
        );
      });

      test('when api returns error, it should throw formatted error', async () => {
        (global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER.deploymentManager.GET as Mock).mockResolvedValue({
          data: null,
          error: { message: 'Server error' },
        });

        const api = createDeploymentsApi(global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER, false);

        await expect(api.vaults.list()).rejects.toThrow('Error listing vaults');
      });

      test('when api returns no data, it should throw formatted error', async () => {
        (global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER.deploymentManager.GET as Mock).mockResolvedValue({
          data: null,
          error: null,
        });

        const api = createDeploymentsApi(global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER, false);

        await expect(api.vaults.list()).rejects.toThrow('Error listing vaults');
      });
    });
  });

  describe('return object', () => {
    test('when hasApiKey is false, it should include vaults', () => {
      const api = createDeploymentsApi(global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER, false);

      expect(api.vaults).toBeDefined();
      expect(api.vaults.create).toBeTypeOf('function');
      expect(api.vaults.list).toBeTypeOf('function');
    });

    test('when hasApiKey is true, it should exclude vaults', () => {
      const api = createDeploymentsApi({ deploymentManager: global.TEST_MOCK_CLIENT }, true);

      expect(api).not.toHaveProperty('vaults');
    });
  });

  describe('createDeployment internal function', () => {
    test('when hasApiKey is false and solana is present, it should create Deployment with vault', async () => {
      (global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER.deploymentManager.GET as Mock).mockResolvedValue({
        data: global.TEST_MOCK_DEPLOYMENT,
        error: null,
      });

      const api = createDeploymentsApi(global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER, false);
      const result = await api.get('8hP5WVzxX8qQE9s6J7BkUxEsb1vQD5viiEZ1pKVXSQFH');

      expect(result.vault).toBeDefined();
      expect(result.vault.address).toBe(global.TEST_MOCK_DEPLOYMENT.vault);
    });

    test('when hasApiKey is true, it should create ApiDeployment without vault', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: global.TEST_MOCK_DEPLOYMENT,
        error: null,
      });

      const api = createDeploymentsApi({ deploymentManager: global.TEST_MOCK_CLIENT }, true);
      const result = await api.get('8hP5WVzxX8qQE9s6J7BkUxEsb1vQD5viiEZ1pKVXSQFH');

      expect(typeof result.vault).toBe('string');
      expect(result.vault).toBe(global.TEST_MOCK_DEPLOYMENT.vault);
    });

    test('when hasApiKey is false but no solana, it should create ApiDeployment without vault', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: global.TEST_MOCK_DEPLOYMENT,
        error: null,
      });

      const api = createDeploymentsApi({ deploymentManager: global.TEST_MOCK_CLIENT }, false);
      const result = await api.get('8hP5WVzxX8qQE9s6J7BkUxEsb1vQD5viiEZ1pKVXSQFH');

      expect(typeof result.vault).toBe('string');
      expect(result.vault).toBe(global.TEST_MOCK_DEPLOYMENT.vault);
    });
  });
});

