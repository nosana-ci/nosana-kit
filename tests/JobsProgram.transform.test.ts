import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JobsProgram, JobState, type Job, type Market, type Run, MarketQueueType } from '../src/programs/JobsProgram.js';
import * as programClient from '../src/generated_clients/jobs/index.js';
import { address, type Address, type Account } from 'gill';
import type { NosanaClient } from '../src/index.js';

function makeSdk(): NosanaClient {
  const valid = '11111111111111111111111111111111';
  const sdk = {
    config: {
      programs: {
        jobsAddress: address(valid),
      },
    },
    logger: { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() },
    solana: { rpc: {} },
  } as unknown as NosanaClient;
  return sdk;
}

function makeJobAccount(): Account<programClient.JobAccount> {
  const addr = address('11111111111111111111111111111111');
  const ipfsBytes = new Uint8Array(32).map((_, i) => i);
  return {
    address: addr,
    data: {
      discriminator: new Uint8Array(8),
      ipfsJob: ipfsBytes,
      ipfsResult: ipfsBytes,
      market: addr,
      node: addr,
      payer: addr,
      price: BigInt(123),
      project: addr,
      state: 2, // COMPLETED
      timeEnd: BigInt(170),
      timeStart: BigInt(160),
      timeout: BigInt(3600),
    },
  } as any;
}

function makeRunAccount(): Account<programClient.RunAccount> {
  const addr = address('11111111111111111111111111111111');
  return {
    address: addr,
    data: {
      discriminator: new Uint8Array(8),
      job: addr,
      node: addr,
      time: BigInt(999),
    },
  } as any;
}

function makeMarketAccount(): Account<programClient.MarketAccount> {
  const addr = address('11111111111111111111111111111111');
  return {
    address: addr,
    data: {
      discriminator: new Uint8Array(8),
      project: addr,
      nodeAccessKey: addr,
      nodeXnosMinimum: BigInt(5),
      jobPrice: BigInt(10),
      jobTimeout: BigInt(200),
      jobType: BigInt(1),
      vault: addr,
      queueType: 1, // NODE_QUEUE
    },
  } as any;
}

describe('JobsProgram transforms', () => {
  let jobs: JobsProgram;

  beforeEach(() => {
    jobs = new JobsProgram(makeSdk());
  });

  it('transformJobAccount converts bigint and ipfs bytes and casts state', () => {
    const acc = makeJobAccount();
    const out = jobs.transformJobAccount(acc);
    expect(out.address).toBe(acc.address);
    expect(out.price).toBe(123);
    expect(out.timeStart).toBe(160);
    expect(out.timeEnd).toBe(170);
    expect(out.timeout).toBe(3600);
    expect(out.state).toBe(JobState.RUNNING);
    // ipfs hash should be a base58 string; length in typical CID range
    expect(typeof out.ipfsJob).toBe('string');
    expect((out.ipfsJob as string).length).toBeGreaterThan(40);
  });

  it('transformRunAccount converts fields to number', () => {
    const acc = makeRunAccount();
    const out = jobs.transformRunAccount(acc);
    expect(out.address).toBe(acc.address);
    expect(out.time).toBe(999);
    expect(out.time).toBe(999);
  });

  it('transformMarketAccount casts queueType and converts numbers', () => {
    const acc = makeMarketAccount();
    const out = jobs.transformMarketAccount(acc);
    expect(out.address).toBe(acc.address);
    expect(out.jobPrice).toBe(10);
    expect(out.jobTimeout).toBe(200);
    expect(out.queueType).toBe(MarketQueueType.NODE_QUEUE);
  });
});


