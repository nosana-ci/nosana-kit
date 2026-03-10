import { vi } from 'vitest';
import type { DeploymentManagerClient } from '../src/client';
import type { ExternalSolanaFunctions } from '../src/types';

/**
 * Creates a mock API client for testing.
 * Works for any openapi-fetch based client (QueryClient, BlockchainIndexerClient, DeploymentManagerClient, etc.)
 */
export function createMockClient() {
  return {
    GET: vi.fn(),
    POST: vi.fn(),
    PUT: vi.fn(),
    DELETE: vi.fn(),
    OPTIONS: vi.fn(),
    HEAD: vi.fn(),
    PATCH: vi.fn(),
    TRACE: vi.fn(),
    request: vi.fn(),
    use: vi.fn(),
    eject: vi.fn(),
  };
}

/**
 * Creates a mock DeploymentManagerClient for testing
 */
export function createMockDeploymentManagerClient(): DeploymentManagerClient {
  return createMockClient() as DeploymentManagerClient;
}

/**
 * Creates mock Solana functions for testing
 */
export function createMockSolanaFunctions(): ExternalSolanaFunctions {
  return {
    getBalance: vi.fn(),
    transferTokensToRecipient: vi.fn(),
    deserializeSignSendAndConfirmTransaction: vi.fn(),
  };
}
