import { vi, type Mock } from 'vitest';
import { createDeployment } from '../createDeployment.js';
import * as actions from '../actions/index.js';

vi.mock('../actions/index.js', () => ({
  deploymentStop: vi.fn(),
  deploymentStart: vi.fn(),
  deploymentArchive: vi.fn(),
  deploymentUpdateReplicaCount: vi.fn(),
  deploymentGetTasks: vi.fn().mockResolvedValue([]),
  deploymentUpdateTimeout: vi.fn(),
  deploymentCreateNewRevision: vi.fn(),
  deploymentUpdateActiveRevision: vi.fn(),
  deploymentUpdateSchedule: vi.fn(),
  deploymentGenerateAuthHeader: vi.fn().mockResolvedValue('auth-header'),
  deploymentGetJob: vi.fn().mockResolvedValue({ id: 'job-id' }),
  deploymentUpdateMarket: vi.fn(),
  deploymentDuplicate: vi.fn(),
}));


vi.mock('../createVault.js', () => ({
  createVault: vi.fn(() => ({
    address: 'vault-address',
    getBalance: vi.fn(),
    topup: vi.fn(),
    withdraw: vi.fn(),
  })),
}));

describe('createDeployment', () => {
  it('should create a deployment with all methods', () => {
    const deployment = createDeployment(global.TEST_MOCK_DEPLOYMENT, global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER, true);

    expect(deployment.id).toBe('8hP5WVzxX8qQE9s6J7BkUxEsb1vQD5viiEZ1pKVXSQFH');
    expect(deployment.start).toBeTypeOf('function');
    expect(deployment.stop).toBeTypeOf('function');
    expect(deployment.archive).toBeTypeOf('function');
    expect(deployment.getTasks).toBeTypeOf('function');
    expect(deployment.getJob).toBeTypeOf('function');
    expect(deployment.generateAuthHeader).toBeTypeOf('function');
    expect(deployment.createRevision).toBeTypeOf('function');
    expect(deployment.updateReplicaCount).toBeTypeOf('function');
    expect(deployment.updateActiveRevision).toBeTypeOf('function');
    expect(deployment.updateTimeout).toBeTypeOf('function');
    expect(deployment.updateSchedule).toBeTypeOf('function');
    expect(deployment.updateMarket).toBeTypeOf('function');
    expect(deployment.duplicate).toBeTypeOf('function');
  });

  it('should convert date strings to Date objects', () => {
    const deployment = createDeployment(global.TEST_MOCK_DEPLOYMENT, global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER, true);

    expect(deployment.created_at).toBeInstanceOf(Date);
    expect(deployment.updated_at).toBeInstanceOf(Date);
  });

  test('when hasApiKey is false, it should include vault', () => {
    const deployment = createDeployment(global.TEST_MOCK_DEPLOYMENT, global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER, false);

    expect(deployment.vault).toBeDefined();
    expect(deployment.vault.address).toBe('vault-address');
  });

  test('when hasApiKey is true, vault should not be a Vault object with methods', () => {
    const deployment = createDeployment(global.TEST_MOCK_DEPLOYMENT, global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER, true);

    // vault is preserved from input as string, not converted to Vault object
    expect(typeof (deployment).vault).toBe('string');
  });

  describe('method execution', () => {
    test('when generateAuthHeader method is invoked, it should call generateAuthHeader action', async () => {
      const deployment = createDeployment(global.TEST_MOCK_DEPLOYMENT, global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER, true);

      const result = await deployment.generateAuthHeader();

      expect(actions.deploymentGenerateAuthHeader).toHaveBeenCalledWith(
        global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER.deploymentManager,
        expect.objectContaining({ id: global.TEST_MOCK_DEPLOYMENT.id }),
        undefined,
      );
      expect(result).toBe('auth-header');
    });

    test('when getJob method is invoked, it should call getJob action', async () => {
      const deployment = createDeployment(global.TEST_MOCK_DEPLOYMENT, global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER, true);

      const result = await deployment.getJob('job-123');

      expect(actions.deploymentGetJob).toHaveBeenCalledWith(
        global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER.deploymentManager,
        global.TEST_MOCK_DEPLOYMENT.id,
        'job-123',
      );
      expect(result).toEqual({ id: 'job-id' });
    });

    test('when updateSchedule method is invoked, it should call updateSchedule action', async () => {
      const deployment = createDeployment(global.TEST_MOCK_DEPLOYMENT, global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER, true);

      await deployment.updateSchedule('0 0 * * *');

      expect(actions.deploymentUpdateSchedule).toHaveBeenCalledWith(
        '0 0 * * *',
        global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER.deploymentManager,
        expect.objectContaining({ id: global.TEST_MOCK_DEPLOYMENT.id }),
      );
    });

    test('when start method is invoked, it should call start action', async () => {
      const deployment = createDeployment(global.TEST_MOCK_DEPLOYMENT, global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER, true);

      await deployment.start();

      expect(actions.deploymentStart).toHaveBeenCalledWith(
        global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER.deploymentManager,
        expect.objectContaining({ id: global.TEST_MOCK_DEPLOYMENT.id }),
      );
    });

    test('when stop method is invoked, it should call stop action', async () => {
      const deployment = createDeployment(global.TEST_MOCK_DEPLOYMENT, global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER, true);

      await deployment.stop();

      expect(actions.deploymentStop).toHaveBeenCalledWith(
        global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER.deploymentManager,
        expect.objectContaining({ id: global.TEST_MOCK_DEPLOYMENT.id }),
      );
    });

    test('when archive method is invoked, it should call archive action', async () => {
      const deployment = createDeployment(global.TEST_MOCK_DEPLOYMENT, global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER, true);

      await deployment.archive();

      expect(actions.deploymentArchive).toHaveBeenCalledWith(
        global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER.deploymentManager,
        expect.objectContaining({ id: global.TEST_MOCK_DEPLOYMENT.id }),
      );
    });

    test('when getTasks method is invoked, it should call getTasks action', async () => {
      const deployment = createDeployment(global.TEST_MOCK_DEPLOYMENT, global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER, true);

      const result = await deployment.getTasks();

      expect(actions.deploymentGetTasks).toHaveBeenCalledWith(
        global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER.deploymentManager,
        expect.objectContaining({ id: global.TEST_MOCK_DEPLOYMENT.id }),
        undefined,
      );
      expect(result).toEqual([]);
    });

    test('when createRevision method is invoked, it should call createRevision action', async () => {
      const deployment = createDeployment(global.TEST_MOCK_DEPLOYMENT, global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER, true);
      const jobDefinition = {
        version: '0.1',
        type: 'container',
        ops: [],
        meta: {},
      };

      await deployment.createRevision(jobDefinition);

      expect(actions.deploymentCreateNewRevision).toHaveBeenCalledWith(
        jobDefinition,
        global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER.deploymentManager,
        expect.objectContaining({ id: global.TEST_MOCK_DEPLOYMENT.id }),
      );
    });

    test('when updateReplicaCount method is invoked, it should call updateReplicaCount action', async () => {
      const deployment = createDeployment(global.TEST_MOCK_DEPLOYMENT, global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER, true);

      await deployment.updateReplicaCount(3);

      expect(actions.deploymentUpdateReplicaCount).toHaveBeenCalledWith(
        3,
        global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER.deploymentManager,
        expect.objectContaining({ id: global.TEST_MOCK_DEPLOYMENT.id }),
      );
    });

    test('when updateActiveRevision method is invoked, it should call updateActiveRevision action', async () => {
      const deployment = createDeployment(global.TEST_MOCK_DEPLOYMENT, global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER, true);

      await deployment.updateActiveRevision(2);

      expect(actions.deploymentUpdateActiveRevision).toHaveBeenCalledWith(
        2,
        global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER.deploymentManager,
        expect.objectContaining({ id: global.TEST_MOCK_DEPLOYMENT.id }),
      );
    });

    test('when updateTimeout method is invoked, it should call updateTimeout action', async () => {
      const deployment = createDeployment(global.TEST_MOCK_DEPLOYMENT, global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER, true);

      await deployment.updateTimeout(120);

      expect(actions.deploymentUpdateTimeout).toHaveBeenCalledWith(
        120,
        global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER.deploymentManager,
        expect.objectContaining({ id: global.TEST_MOCK_DEPLOYMENT.id }),
      );
    });

    test('when updateMarket method is invoked, it should call updateMarket action', async () => {
      const deployment = createDeployment(global.TEST_MOCK_DEPLOYMENT, global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER, true);

      await deployment.updateMarket('rdRYm53F9nj7VWenCvuJw4Zf85KEo5op9kAiQk52kFh');

      expect(actions.deploymentUpdateMarket).toHaveBeenCalledWith(
        'rdRYm53F9nj7VWenCvuJw4Zf85KEo5op9kAiQk52kFh',
        global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER.deploymentManager,
        expect.objectContaining({ id: global.TEST_MOCK_DEPLOYMENT.id }),
      );
    });

    describe('duplicate', () => {
      const copy = {
        ...global.TEST_MOCK_DEPLOYMENT,
        id: 'CopyDeploymentId111111111111111111111111111',
        name: 'copied-deployment',
      };

      beforeEach(() => {
        (actions.deploymentDuplicate as Mock).mockResolvedValue(copy);
      });

      test('when invoked, it should call duplicate action and wrap the copy', async () => {
        const deployment = createDeployment(global.TEST_MOCK_DEPLOYMENT, global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER, true);

        const result = await deployment.duplicate({ name: 'copied-deployment', autostart: true });

        expect(actions.deploymentDuplicate).toHaveBeenCalledWith(
          { name: 'copied-deployment', autostart: true },
          global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER.deploymentManager,
          expect.objectContaining({ id: global.TEST_MOCK_DEPLOYMENT.id }),
        );
        expect(result.id).toBe(copy.id);
        expect(result.name).toBe('copied-deployment');
        expect(result.created_at).toBeInstanceOf(Date);
        expect(result.start).toBeTypeOf('function');
        expect(result.duplicate).toBeTypeOf('function');
        expect(typeof result.vault).toBe('string');
        expect(deployment.id).toBe(global.TEST_MOCK_DEPLOYMENT.id);
      });

      test('when hasApiKey is false, the copy should include a vault', async () => {
        const deployment = createDeployment(global.TEST_MOCK_DEPLOYMENT, global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER, false);

        const result = await deployment.duplicate({ name: 'copied-deployment' });

        expect(result.vault).toBeDefined();
        expect(result.vault.address).toBe('vault-address');
      });
    });
  });
});

