import type { Mock } from 'vitest';

import { createNosanaReservationsApi } from '../index.js';

const GPUS = {
  gpus: [
    {
      name: 'NVIDIA GeForce RTX 4090',
      vramGb: 24,
      nodes: 120,
      available: 31,
      working: 88,
      markets: ['97G9NnvBDQ'],
    },
  ],
};

const OPTIONS = {
  nodes: 40,
  metrics: [
    {
      key: 'ram_gb',
      group: null,
      type: 'float' as const,
      match: 'minimum' as const,
      perInstance: false,
      min: 16,
      max: 256,
      values: [{ value: 64, nodes: 40 }],
    },
  ],
};

const AVAILABLE = {
  total: 2,
  price: { minUsdPerHour: 0.13, maxUsdPerHour: 0.36 },
  nodes: [{ nodeAddress: 'node-1', market: '97G9NnvBDQ' }],
};

describe('createNosanaReservationsApi', () => {
  const api = createNosanaReservationsApi({
    hostManager: global.TEST_MOCK_CLIENT,
  });

  describe('listGpus', () => {
    it('returns the GPU catalogue', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: GPUS,
        error: null,
      });

      await expect(api.listGpus()).resolves.toEqual(GPUS);
      expect((global.TEST_MOCK_CLIENT.GET as Mock).mock.calls[0][0]).toBe(
        '/reservations/gpus',
      );
    });

    it('throws when host-manager fails', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Indexer unavailable' },
      });

      await expect(api.listGpus()).rejects.toThrow('Failed to fetch GPU models');
    });
  });

  describe('getRequirementOptions', () => {
    it('posts the metrics and requirements', async () => {
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({
        data: OPTIONS,
        error: null,
      });
      const request = {
        metrics: ['ram_gb'],
        requirements: { name: 'NVIDIA GeForce RTX 4090' },
      };

      await expect(api.getRequirementOptions(request)).resolves.toEqual(
        OPTIONS,
      );
      const [path, init] = (global.TEST_MOCK_CLIENT.POST as Mock).mock.calls[0];
      expect(path).toBe('/reservations/requirements');
      expect(init).toEqual({ body: request });
    });

    it('sends an empty body when called without a request', async () => {
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({
        data: OPTIONS,
        error: null,
      });

      await api.getRequirementOptions();
      expect((global.TEST_MOCK_CLIENT.POST as Mock).mock.calls[0][1]).toEqual({
        body: {},
      });
    });

    it('throws when host-manager fails', async () => {
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Unknown metric' },
      });

      await expect(api.getRequirementOptions()).rejects.toThrow(
        'Failed to fetch requirement options',
      );
    });
  });

  describe('findAvailable', () => {
    it('posts the requirements', async () => {
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({
        data: AVAILABLE,
        error: null,
      });
      const request = { requirements: { ram_gb: 64, country: 'NL' } };

      await expect(api.findAvailable(request)).resolves.toEqual(AVAILABLE);
      const [path, init] = (global.TEST_MOCK_CLIENT.POST as Mock).mock.calls[0];
      expect(path).toBe('/reservations/available');
      expect(init).toEqual({ body: request });
    });

    it('throws when host-manager fails', async () => {
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Indexer unavailable' },
      });

      await expect(api.findAvailable()).rejects.toThrow(
        'Failed to find available nodes',
      );
    });
  });
});
