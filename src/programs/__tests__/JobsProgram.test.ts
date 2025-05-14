import { jest } from '@jest/globals';
import { JobsProgram } from '../JobsProgram';
import { NosanaClient, NosanaNetwork } from '../../index';

// Mock the actual import path used in JobsProgram.ts
jest.mock('../../generated_client/index.js', () => ({
  NOSANA_JOBS_PROGRAM_ADDRESS: 'test-jobs-program-id',
  fetchJobAccount: jest.fn().mockImplementation(() => Promise.reject(new Error('Not implemented'))),
}));

describe('JobsProgram', () => {
  let client: NosanaClient;
  let jobs: JobsProgram;

  beforeEach(() => {
    client = new NosanaClient(NosanaNetwork.MAINNET, {
      solana: {
        cluster: 'mainnet-beta',
        rpcEndpoint: 'https://test-rpc.com',
        commitment: 'confirmed'
      }
    });
    jobs = new JobsProgram(client);
  });

  it('should initialize with client', () => {
    expect(jobs).toBeDefined();
  });

  it('should throw error when get is called (not implemented)', async () => {
    // Use a valid base58 Solana address (32-44 chars)
    const validAddress = '4Nd1m5Q7bG7y5Q6Q2v7Q2v7Q2v7Q2v7Q2v7Q2v7Q2v7Q'; // 44 chars
    await expect(jobs.get(validAddress)).rejects.toThrow('Not implemented');
  });
}); 