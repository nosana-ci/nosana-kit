/// <reference types="vitest/globals" />

import 'vitest';
import type { ApiKeyAuth, Balance, CreateDeployment, CreateNosanaApiOptions, Market, MarketRequiredResources, NosanaApiExtendJobRequest, NosanaApiExtendJobResponse, NosanaApiGetJobByAddressResponse, NosanaApiListJobRequest, NosanaApiListJobResponse, NosanaApiStopJobResponse, DeploymentRouteClientsWithSigner, Task } from '../src';
import type { Mock } from 'vitest';
import { Deployment } from '@nosana/types';

declare global {
  // Auth fixtures
  var TEST_API_KEY: ApiKeyAuth;
  var TEST_NOSANA_API_OPTIONS: CreateNosanaApiOptions;

  // Mock client (used across all API tests) - runtime is mocked via openapi-fetch mock
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var TEST_MOCK_CLIENT: any;
  var TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER: DeploymentRouteClientsWithSigner;

  // Job fixtures
  var TEST_CREATE_JOB_REQUEST: NosanaApiListJobRequest;
  var TEST_MOCK_CREATE_JOB_RESPONSE: NosanaApiListJobResponse;
  var TEST_MOCK_JOB: NosanaApiGetJobByAddressResponse;
  var TEST_EXTEND_JOB_REQUEST: NosanaApiExtendJobRequest;
  var TEST_MOCK_EXTEND_JOB_RESPONSE: NosanaApiExtendJobResponse;
  var TEST_MOCK_STOP_JOB_RESPONSE: NosanaApiStopJobResponse

  // Credits fixtures
  var TEST_MOCK_BALANCE: Balance;

  // Markets fixtures
  var TEST_MOCK_MARKET: Market;
  var TEST_MOCK_MARKETS_LIST: Market[];
  var TEST_MOCK_REQUIRED_RESOURCES: MarketRequiredResources;

  // Deployment fixtures
  var TEST_MOCK_DEPLOYMENT: Deployment;
  var TEST_MOCK_DEPLOYMENTS_LIST: { deployments: Deployment[]; pagination: { cursor_next: string | null; cursor_prev: string | null; has_next_page: boolean; has_previous_page: boolean; page_size: number; current_page: number; total_items: number } };
  var TEST_CREATE_DEPLOYMENT_REQUEST: CreateDeployment;
  var TEST_MOCK_TASK: Task;
  var TEST_MOCK_TASKS_LIST: Task[];
  var TEST_MOCK_TASKS_RESPONSE: { tasks: Task[]; pagination: { cursor_next: string | null; cursor_prev: string | null; total_items: number } };

  // Vault fixtures
  var TEST_MOCK_VAULT: { vault: string; owner: string; created_at: string };
  var TEST_MOCK_VAULTS_LIST: Array<{ vault: string; owner: string; created_at: string }>;

  // Mock Api responses
  var TEST_MOCK_TRANSACTION_SIGNATURE: string;
}

export { };
