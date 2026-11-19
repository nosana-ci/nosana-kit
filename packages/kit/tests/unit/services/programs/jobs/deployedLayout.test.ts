import { describe, it, expect, vi, afterEach } from 'vitest';
import { type Instruction, AccountRole } from '@solana/kit';
import { LIST_INSTRUCTION_ACCOUNTS } from '@nosana/jobs-program';

import { createMatchDeployedLayout } from '../../../../../src/services/programs/jobs/deployedLayout.js';
import { AddressFactory } from '../../../setup/index.js';

const LEGACY_ACCOUNT_COUNT = Object.keys(LIST_INSTRUCTION_ACCOUNTS).length + 3;
const LEGACY_RECHECK_MS = 30_000;

// The RPC delivers custom program error codes as bigints.
const REJECTED_BY_FEE_PROGRAM = { InstructionError: [0, { Custom: 3010n }] };
const OTHER_PROGRAM_ERROR = { InstructionError: [0, { Custom: 6000 }] };

const FEE_PAYER = AddressFactory.create(900);
const rewards = async () => ({
  rewardsReflection: AddressFactory.create(901),
  rewardsVault: AddressFactory.create(902),
  rewardsProgram: AddressFactory.create(903),
});

function feeLayoutList(): Instruction {
  const accounts = Object.keys(LIST_INSTRUCTION_ACCOUNTS).map((_, i) => ({
    address: AddressFactory.create(600 + i),
    role: AccountRole.WRITABLE,
  }));
  return { programAddress: AddressFactory.create(1), accounts, data: new Uint8Array([7]) };
}

/** An RPC whose simulations end with the given errors, the last one repeating. */
function rpcSimulating(...errors: unknown[]) {
  let call = 0;
  const simulateTransaction = vi.fn(() => ({
    send: async () => ({ value: { err: errors[Math.min(call++, errors.length - 1)] } }),
  }));
  return { rpc: { simulateTransaction } as never, simulateTransaction };
}

describe('createMatchDeployedLayout', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the legacy layout while the program accepts it', async () => {
    const { rpc } = rpcSimulating(null);
    const match = createMatchDeployedLayout(rpc, rewards);

    const instruction = await match('list', feeLayoutList(), FEE_PAYER);
    expect(instruction.accounts).toHaveLength(LEGACY_ACCOUNT_COUNT);
  });

  it('keeps the legacy layout when the program fails it for another reason', async () => {
    const { rpc } = rpcSimulating(OTHER_PROGRAM_ERROR);
    const match = createMatchDeployedLayout(rpc, rewards);

    const instruction = await match('list', feeLayoutList(), FEE_PAYER);
    expect(instruction.accounts).toHaveLength(LEGACY_ACCOUNT_COUNT);
  });

  it('returns the fee layout once the program rejects the legacy one', async () => {
    const { rpc } = rpcSimulating(REJECTED_BY_FEE_PROGRAM);
    const match = createMatchDeployedLayout(rpc, rewards);

    const fee = feeLayoutList();
    expect(await match('list', fee, FEE_PAYER)).toBe(fee);
  });

  it('stops simulating after the fee layout is found', async () => {
    const { rpc, simulateTransaction } = rpcSimulating(REJECTED_BY_FEE_PROGRAM);
    const match = createMatchDeployedLayout(rpc, rewards);

    await match('list', feeLayoutList(), FEE_PAYER);
    await match('extend', feeLayoutList(), FEE_PAYER);
    expect(simulateTransaction).toHaveBeenCalledTimes(1);
  });

  it('reuses a legacy answer, then asks again once it is stale', async () => {
    vi.useFakeTimers();
    const { rpc, simulateTransaction } = rpcSimulating(null, REJECTED_BY_FEE_PROGRAM);
    const match = createMatchDeployedLayout(rpc, rewards);

    await match('list', feeLayoutList(), FEE_PAYER);
    await match('list', feeLayoutList(), FEE_PAYER);
    expect(simulateTransaction).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(LEGACY_RECHECK_MS);
    const fee = feeLayoutList();
    expect(await match('list', fee, FEE_PAYER)).toBe(fee);
    expect(simulateTransaction).toHaveBeenCalledTimes(2);
  });

  it('shares one simulation between concurrent builds', async () => {
    const { rpc, simulateTransaction } = rpcSimulating(null);
    const match = createMatchDeployedLayout(rpc, rewards);

    await Promise.all([1, 2, 3].map(() => match('list', feeLayoutList(), FEE_PAYER)));
    expect(simulateTransaction).toHaveBeenCalledTimes(1);
  });

  it('simulates without signatures against a recent blockhash', async () => {
    const { rpc, simulateTransaction } = rpcSimulating(null);
    const match = createMatchDeployedLayout(rpc, rewards);

    await match('list', feeLayoutList(), FEE_PAYER);
    expect(simulateTransaction).toHaveBeenCalledWith(expect.any(String), {
      encoding: 'base64',
      sigVerify: false,
      replaceRecentBlockhash: true,
    });
  });
});
