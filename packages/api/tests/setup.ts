/**
 * Global test setup file
 * This file runs before all tests and sets up the testing environment
 */

import { vi, beforeEach, afterEach } from 'vitest';
import { createMockClient, createMockSolanaFunctions } from './mockFactory.js';

// Mock openapi-fetch globally
vi.mock('openapi-fetch', () => ({
  default: vi.fn(() => global.TEST_MOCK_CLIENT),
}));

// Global test hooks
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Global mock client for API tests
global.TEST_MOCK_CLIENT = createMockClient();

global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER = {
  deploymentManager: createMockClient(),
  solana: createMockSolanaFunctions(),
};

// Auth fixtures
global.TEST_API_KEY = 'test-api-key';
global.TEST_NOSANA_API_OPTIONS = {};

// Request fixtures
global.TEST_CREATE_JOB_REQUEST = {
  ipfsHash: 'QmcbGMTZXz9y1AyeBepNGnuFBMzzrfb39JezsuwjQ1TStC',
  market: '9HnJacS25TnErsKMYJmKqWeCAMYuwY7gzhz9Eqhp5VE7',
  timeout: 60,
};
global.TEST_EXTEND_JOB_REQUEST = {
  address: '8TjrkaZmW2UFjpm2Va5LECJc7zoFrbUJETk6fPimGi9a',
  seconds: 3600,
};

// Job response fixtures
global.TEST_MOCK_JOB = {
  ipfsJob: 'QmcbGMTZXz9y1AyeBepNGnuFBMzzrfb39JezsuwjQ1TStC',
  ipfsResult: null,
  market: '9HnJacS25TnErsKMYJmKqWeCAMYuwY7gzhz9Eqhp5VE7',
  node: '7XkMcd1AYjCJU7SjrpGmGWHshfr9iVTiw88u6CThYEpL',
  payer: 'credFgXCGH3JFUT6WEKF6tJitxrXhSCM2VEqF7GE6pt',
  price: 318,
  project: '4f4aykQByWqVqyrsoevsAvkVxqYFHy3uaiYPupTsjGPN',
  state: 1,
  type: 'dashboard',
  jobDefinition: {
    ops: [
      {
        id: 'Pytorch',
        args: {
          cmd: [
            'jupyter',
            'lab',
            '--ip=0.0.0.0',
            '--port=8888',
            '--no-browser',
            '--allow-root',
          ],
          gpu: true,
          image: 'docker.io/nosana/pytorch-jupyter:2.0.0',
          expose: 8888,
        },
        type: 'container/run',
      },
    ],
    meta: {
      trigger: 'dashboard',
      system_requirements: { required_vram: 4 },
    },
    type: 'container',
    version: '0.1',
  },
  jobResult: null,
  jobStatus: null,
  timeEnd: 0,
  timeStart: 1764226351,
  benchmarkProcessedAt: null,
  timeout: 3660,
  usdRewardPerHour: 0.34934717,
  listedAt: 1764226351,
};

global.TEST_MOCK_CREATE_JOB_RESPONSE = {
  job: '8TjrkaZmW2UFjpm2Va5LECJc7zoFrbUJETk6fPimGi9a',
  tx: '9HnJacS25TnErsKMYJmKqWeCAMYuwY7gzhz9Eqhp5VE7',
  run: '9HnJacS25TnErsKMYJmKqWeCAMYuwY7gzhz9Eqhp5VE7',
  credits: {
    costUSD: 0.01,
    creditsUsed: 10,
    reservationId: 'e578ab6f-8a7b-48c0-a4b0-0869f074227d',
    project: '4f4aykQByWqVqyrsoevsAvkVxqYFHy3uaiYPupTsjGPN',
  },
};

global.TEST_MOCK_EXTEND_JOB_RESPONSE = {
  job: '8TjrkaZmW2UFjpm2Va5LECJc7zoFrbUJETk6fPimGi9a',
  tx: '66vMVSbS217Hn9KUVUhZNzFy2MCuqmd4fomDNbRySoC5n2vR6yxxbAZKfVwVCk87vPGDd6UWApg6j1VjLR1RNLmM',
  credits: {
    costUSD: 0.39,
    creditsUsed: 390,
    reservationId: 'd2be6d73-4d5a-495a-8294-861a9a9287f4',
  },
};

global.TEST_MOCK_STOP_JOB_RESPONSE = {
  job: '8TjrkaZmW2UFjpm2Va5LECJc7zoFrbUJETk6fPimGi9a',
  tx: '49cu6scFcVxEbb8quUrJNwRCK3CzNsZyafmeJChDBg6pH8Vkir8suazNnT5iKVXyntQPCcff9sAKFwMS6t8pWkDg',
  delisted: false,
};

// Credits fixtures
global.TEST_MOCK_BALANCE = {
  assignedCredits: 100.5,
  reservedCredits: 0.34,
  settledCredits: 74.595,
};

// Markets fixtures
global.TEST_MOCK_MARKET = {
  address: 'Dcwz62TisNbWuto6KJM2EGYGVKnHbdZGVGmgLASzsXy8',
  slug: 'nvidia-4090-community',
  name: 'NVIDIA 4090 Community',
  sft: 'HLuwMuBQgJt9QzR64VuqKod5wxZkCogryK4CFqH2id43',
  type: 'COMMUNITY',
  usd_reward_per_hour: 0.218175,
  nos_reward_per_second: 0.000196,
  nos_job_price_per_second: 0.0002156,
  network_fee_percentage: 10,
  premium_community_relation: '97G9NnvBDQ2WpKu6fasoMsAKmfj63C9rhysJnkeWodAf',
  gpu_types: ['NVIDIA GeForce RTX 4090 D', 'NVIDIA GeForce RTX 4090'],
  required_images: [
    'docker.io/tensorflow/tensorflow:2.17.0-gpu-jupyter',
    'docker.io/nosana/anti-spoof:1.0.0',
    'docker.io/vllm/vllm-openai:v0.9.2',
    'docker.io/ollama/ollama:0.11.3',
  ],
  required_remote_resources: [
    { type: 'S3', url: 'https://models.nosana.io/foldingAtHome' },
  ],
  client: false,
  max_usd_uptime_reward_per_day: 0,
  lowest_vram: 24,
};

global.TEST_MOCK_MARKETS_LIST = [global.TEST_MOCK_MARKET];

global.TEST_MOCK_REQUIRED_RESOURCES = {
  required_images: global.TEST_MOCK_MARKET.required_images,
  required_remote_resources: global.TEST_MOCK_MARKET.required_remote_resources,
};

// Deployment fixtures
global.TEST_MOCK_DEPLOYMENT = {
  id: '8hP5WVzxX8qQE9s6J7BkUxEsb1vQD5viiEZ1pKVXSQFH',
  name: 'Pytorch Jupyter Notebook',
  vault: '4f4aykQByWqVqyrsoevsAvkVxqYFHy3uaiYPupTsjGPN',
  market: '5eX3kWkrcbwejEc1svbfP4F7NKYjtPDuyU5KnV1hUBKg',
  owner: '4f4aykQByWqVqyrsoevsAvkVxqYFHy3uaiYPupTsjGPN',
  status: 'DRAFT',
  revisions: [
    {
      revision: 1,
      deployment: '8hP5WVzxX8qQE9s6J7BkUxEsb1vQD5viiEZ1pKVXSQFH',
      ipfs_definition_hash: 'QmSnc95rCymC4LczSNn36xNH1NtfEBbRHYZ3LdAiiaceBo',
      job_definition: {
        version: '0.1',
        type: 'container',
        ops: [
          {
            type: 'container/run',
            id: 'Pytorch',
            args: {
              image: 'docker.io/nosana/pytorch-jupyter:2.0.0',
              cmd: [
                'jupyter',
                'lab',
                '--ip=0.0.0.0',
                '--port=8888',
                '--no-browser',
                '--allow-root',
                "--ServerApp.token=''",
                "--ServerApp.password=''",
              ],
              expose: 8888,
              gpu: true,
            },
          },
        ],
        deployment_id: '8hP5WVzxX8qQE9s6J7BkUxEsb1vQD5viiEZ1pKVXSQFH',
        meta: {
          trigger: 'deployment-manager',
          system_requirements: { required_vram: 4 },
        },
      },
      created_at: '2025-12-04T12:20:14.294Z',
    },
  ],
  replicas: 1,
  timeout: 60,
  jobs: [],
  events: [],
  endpoints: [
    {
      opId: 'Pytorch',
      port: 8888,
      url: 'https://3JZPUXiKwiimMUJBzhLSZzumTs8pqRjDJNpSbdJrMB3m.node.k8s.prd.nos.ci',
    },
  ],
  confidential: false,
  active_revision: 1,
  created_at: '2025-12-04T12:20:13.591Z',
  updated_at: '2025-12-04T12:20:13.591Z',
  strategy: 'SIMPLE',
};

global.TEST_MOCK_DEPLOYMENTS_LIST = [global.TEST_MOCK_DEPLOYMENT];

global.TEST_CREATE_DEPLOYMENT_REQUEST = {
  name: 'Pytorch Jupyter Notebook',
  market: '5eX3kWkrcbwejEc1svbfP4F7NKYjtPDuyU5KnV1hUBKg',
  replicas: 1,
  timeout: 60,
  strategy: 'SIMPLE',
  job_definition: {
    ops: [
      {
        id: 'Pytorch',
        args: {
          cmd: [
            'jupyter',
            'lab',
            '--ip=0.0.0.0',
            '--port=8888',
            '--no-browser',
            '--allow-root',
            "--ServerApp.token=''",
            "--ServerApp.password=''",
          ],
          gpu: true,
          image: 'docker.io/nosana/pytorch-jupyter:2.0.0',
          expose: 8888,
        },
        type: 'container/run',
      },
    ],
    meta: {
      trigger: 'dashboard',
      system_requirements: { required_vram: 4 },
    },
    type: 'container',
    version: '0.1',
  },
};

global.TEST_MOCK_TASK = {
  task: 'LIST',
  deploymentId: '8hP5WVzxX8qQE9s6J7BkUxEsb1vQD5viiEZ1pKVXSQFH',
  due_at: new Date('2025-12-04T12:30:14.294Z').toString(),
  created_at: new Date('2025-12-04T12:20:14.294Z').toString(),
};

global.TEST_MOCK_TASKS_LIST = [global.TEST_MOCK_TASK];

global.TEST_MOCK_TASKS_RESPONSE = {
  tasks: global.TEST_MOCK_TASKS_LIST,
  pagination: {
    cursor_next: null,
    cursor_prev: null,
    total_items: global.TEST_MOCK_TASKS_LIST.length,
  },
};

// Vault fixtures
global.TEST_MOCK_VAULT = {
  vault: '4f4aykQByWqVqyrsoevsAvkVxqYFHy3uaiYPupTsjGPN',
  owner: '4f4aykQByWqVqyrsoevsAvkVxqYFHy3uaiYPupTsjGPN',
  created_at: '2025-12-04T12:20:13.591Z',
};

global.TEST_MOCK_VAULTS_LIST = [
  global.TEST_MOCK_VAULT,
  {
    vault: 'AnotherVaultAddress123456789',
    owner: 'AnotherVaultAddress123456789',
    created_at: '2025-12-04T12:21:13.591Z',
  },
];

// Mock Api responses
global.TEST_MOCK_TRANSACTION_SIGNATURE = 'base64-encoded-transaction';
