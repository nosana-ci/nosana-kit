import { describe, it, expect, vi, afterEach } from 'vitest';
import { type Address, type Instruction, AccountRole, getAddressEncoder } from '@solana/kit';
import { LIST_INSTRUCTION_ACCOUNTS } from '@nosana/jobs-program';

import { createMatchDeployedLayout } from '../../../../../src/services/programs/jobs/deployedLayout.js';
import { AddressFactory } from '../../../setup/index.js';

const LEGACY_ACCOUNT_COUNT = Object.keys(LIST_INSTRUCTION_ACCOUNTS).length + 3;
const LEGACY_RECHECK_MS = 30_000;

// The RPC delivers custom program error codes as bigints.
const REJECTED_BY_FEE_PROGRAM = { InstructionError: [0, { Custom: 3010n }] };
const OTHER_PROGRAM_ERROR = { InstructionError: [0, { Custom: 3012n }] };
const NO_FUNDS_FOR_FEE = 'InsufficientFundsForFee';

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

/**
 * An RPC whose simulations end with the given errors, the last one repeating. An `Error`
 * is thrown by the RPC call itself.
 */
function rpcSimulating(...errors: unknown[]) {
  let call = 0;
  const simulateTransaction = vi.fn(() => ({
    send: async () => {
      const err = errors[Math.min(call++, errors.length - 1)];
      if (err instanceof Error) throw err;
      return { value: { err } };
    },
  }));
  return { solana: { rpc: { simulateTransaction } } as never, simulateTransaction };
}

/** Whether the simulated transaction names `account`, e.g. as its fee payer. */
function simulatedWith(simulateTransaction: ReturnType<typeof vi.fn>, account: Address) {
  const wire = Buffer.from(simulateTransaction.mock.calls[0][0] as string, 'base64');
  return wire.includes(Buffer.from(getAddressEncoder().encode(account)));
}

describe('createMatchDeployedLayout', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the legacy layout while the program accepts it', async () => {
    const { solana } = rpcSimulating(null);
    const match = createMatchDeployedLayout(solana, rewards);

    const instruction = await match('list', feeLayoutList(), FEE_PAYER);
    expect(instruction.accounts).toHaveLength(LEGACY_ACCOUNT_COUNT);
  });

  it.each([
    ['an instruction error of its own', OTHER_PROGRAM_ERROR],
    ['a transaction error', NO_FUNDS_FOR_FEE],
  ])('builds the legacy layout on %s, but asks again next time', async (_, error) => {
    const { solana, simulateTransaction } = rpcSimulating(error, REJECTED_BY_FEE_PROGRAM);
    const match = createMatchDeployedLayout(solana, rewards);

    const instruction = await match('list', feeLayoutList(), FEE_PAYER);
    expect(instruction.accounts).toHaveLength(LEGACY_ACCOUNT_COUNT);

    const fee = feeLayoutList();
    expect(await match('list', fee, FEE_PAYER)).toBe(fee);
    expect(simulateTransaction).toHaveBeenCalledTimes(2);
  });

  it('returns the fee layout once the program rejects the legacy one', async () => {
    const { solana } = rpcSimulating(REJECTED_BY_FEE_PROGRAM);
    const match = createMatchDeployedLayout(solana, rewards);

    const fee = feeLayoutList();
    expect(await match('list', fee, FEE_PAYER)).toBe(fee);
  });

  it('stops simulating after the fee layout is found', async () => {
    const { solana, simulateTransaction } = rpcSimulating(REJECTED_BY_FEE_PROGRAM);
    const match = createMatchDeployedLayout(solana, rewards);

    await match('list', feeLayoutList(), FEE_PAYER);
    await match('extend', feeLayoutList(), FEE_PAYER);
    expect(simulateTransaction).toHaveBeenCalledTimes(1);
  });

  it('reuses a legacy answer, then asks again once it is stale', async () => {
    vi.useFakeTimers();
    const { solana, simulateTransaction } = rpcSimulating(null, REJECTED_BY_FEE_PROGRAM);
    const match = createMatchDeployedLayout(solana, rewards);

    await match('list', feeLayoutList(), FEE_PAYER);
    await match('list', feeLayoutList(), FEE_PAYER);
    expect(simulateTransaction).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(LEGACY_RECHECK_MS);
    const fee = feeLayoutList();
    expect(await match('list', fee, FEE_PAYER)).toBe(fee);
    expect(simulateTransaction).toHaveBeenCalledTimes(2);
  });

  it('shares one simulation between concurrent builds', async () => {
    const { solana, simulateTransaction } = rpcSimulating(null);
    const match = createMatchDeployedLayout(solana, rewards);

    await Promise.all([1, 2, 3].map(() => match('list', feeLayoutList(), FEE_PAYER)));
    expect(simulateTransaction).toHaveBeenCalledTimes(1);
  });

  it('lets the NOS payer pay for the simulation', async () => {
    const { solana, simulateTransaction } = rpcSimulating(null);
    await createMatchDeployedLayout(solana, rewards)('list', feeLayoutList(), FEE_PAYER);
    expect(simulatedWith(simulateTransaction, FEE_PAYER)).toBe(true);
  });

  it("lets the client's own fee payer pay for the simulation", async () => {
    const { simulateTransaction } = rpcSimulating(null);
    const clientFeePayer = AddressFactory.create(904);
    const solana = { rpc: { simulateTransaction }, feePayer: { address: clientFeePayer } } as never;

    await createMatchDeployedLayout(solana, rewards)('list', feeLayoutList(), FEE_PAYER);
    expect(simulatedWith(simulateTransaction, clientFeePayer)).toBe(true);
    expect(simulatedWith(simulateTransaction, FEE_PAYER)).toBe(false);
  });

  it('lets each build simulate its own instruction when the shared one settles nothing', async () => {
    const { solana, simulateTransaction } = rpcSimulating(
      OTHER_PROGRAM_ERROR,
      REJECTED_BY_FEE_PROGRAM
    );
    const match = createMatchDeployedLayout(solana, rewards);

    const builds = [feeLayoutList(), feeLayoutList(), feeLayoutList()];
    const [first, ...rest] = await Promise.all(
      builds.map((instruction) => match('list', instruction, FEE_PAYER))
    );
    expect(first.accounts).toHaveLength(LEGACY_ACCOUNT_COUNT);
    expect(rest).toEqual(builds.slice(1));
    expect(simulateTransaction).toHaveBeenCalledTimes(3);
  });

  it('fails only the build whose simulation could not be sent', async () => {
    const { solana, simulateTransaction } = rpcSimulating(new Error('429'), null);
    const match = createMatchDeployedLayout(solana, rewards);

    const [failed, built] = await Promise.allSettled([
      match('list', feeLayoutList(), FEE_PAYER),
      match('list', feeLayoutList(), FEE_PAYER),
    ]);
    expect(failed.status).toBe('rejected');
    expect(built.status).toBe('fulfilled');
    expect(simulateTransaction).toHaveBeenCalledTimes(2);
  });

  it('simulates without signatures against a recent blockhash', async () => {
    const { solana, simulateTransaction } = rpcSimulating(null);
    const match = createMatchDeployedLayout(solana, rewards);

    await match('list', feeLayoutList(), FEE_PAYER);
    expect(simulateTransaction).toHaveBeenCalledWith(expect.any(String), {
      encoding: 'base64',
      sigVerify: false,
      replaceRecentBlockhash: true,
    });
  });
});
