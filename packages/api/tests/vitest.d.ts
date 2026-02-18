/// <reference types="vitest/globals" />

import 'vitest';
import type { ApiKeyAuth, Balance, CreateDeployment, CreateNosanaApiOptions, Market, MarketRequiredResources, NosanaApiExtendJobRequest, NosanaApiExtendJobResponse, NosanaApiGetJobByAddressResponse, NosanaApiListJobRequest, NosanaApiListJobResponse, NosanaApiStopJobResponse, RouteOptions, RouteOptionsWithSigner, Task } from '../src';
import type { Mock } from 'vitest';
import { Deployment } from '@nosana/types';
import { QueryClient } from '../src/client';

declare global {
  // Auth fixtures
  var TEST_API_KEY: ApiKeyAuth;
  var TEST_NOSANA_API_OPTIONS: CreateNosanaApiOptions;

  // Mock client (used across all API tests) - typed as QueryClient but runtime is mocked
  var TEST_MOCK_CLIENT: QueryClient;
  var TEST_ROUTE_OPTIONS_WITH_SIGNER: RouteOptionsWithSigner;

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
  var TEST_MOCK_DEPLOYMENTS_LIST: Deployment[];
  var TEST_CREATE_DEPLOYMENT_REQUEST: CreateDeployment;
  var TEST_MOCK_TASK: Task;
  var TEST_MOCK_TASKS_LIST: Task[];

  // Vault fixtures
  var TEST_MOCK_VAULT: { vault: string; owner: string; created_at: string };
  var TEST_MOCK_VAULTS_LIST: Array<{ vault: string; owner: string; created_at: string }>;

  // Mock Api responses
  var TEST_MOCK_TRANSACTION_SIGNATURE: string;
}

export { };
