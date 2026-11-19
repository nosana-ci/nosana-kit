import { describe, it, expect } from 'vitest';
import { type Address, type Instruction, AccountRole } from '@solana/kit';
import {
  ASSIGN_INSTRUCTION_ACCOUNTS,
  EXTEND_INSTRUCTION_ACCOUNTS,
  LIST_INSTRUCTION_ACCOUNTS,
} from '@nosana/jobs-program';

import {
  type LayoutDependentInstructionName,
  toFeeLayout,
  toLegacyLayout,
} from '../../../../../src/services/programs/jobs/legacyLayout.js';
import { AddressFactory } from '../../../setup/index.js';

// The account order of the jobs program before the fee release (IDL v2.2.12).
const LEGACY_ACCOUNT_ORDER: Record<LayoutDependentInstructionName, string[]> = {
  list: [
    'job',
    'market',
    'run',
    'user',
    'vault',
    'payer',
    'rewardsReflection',
    'rewardsVault',
    'authority',
    'rewardsProgram',
    'tokenProgram',
    'systemProgram',
    'marketSettings',
    'projectNft',
    'projectMetadata',
  ],
  assign: [
    'job',
    'market',
    'run',
    'node',
    'user',
    'vault',
    'payer',
    'rewardsReflection',
    'rewardsVault',
    'authority',
    'rewardsProgram',
    'tokenProgram',
    'systemProgram',
    'marketSettings',
    'projectNft',
    'projectMetadata',
  ],
  extend: [
    'job',
    'market',
    'user',
    'vault',
    'rewardsReflection',
    'rewardsVault',
    'authority',
    'payer',
    'rewardsProgram',
    'tokenProgram',
  ],
};

const FEE_LAYOUT_ACCOUNTS = {
  list: LIST_INSTRUCTION_ACCOUNTS,
  assign: ASSIGN_INSTRUCTION_ACCOUNTS,
  extend: EXTEND_INSTRUCTION_ACCOUNTS,
};

const ALL_NAMES = [...new Set(Object.values(LEGACY_ACCOUNT_ORDER).flat())];
const ADDRESS_OF = new Map(ALL_NAMES.map((name, i) => [name, AddressFactory.create(500 + i)]));
const NAME_OF = new Map([...ADDRESS_OF].map(([name, address]) => [address, name]));

const REWARDS = {
  rewardsReflection: ADDRESS_OF.get('rewardsReflection')!,
  rewardsVault: ADDRESS_OF.get('rewardsVault')!,
  rewardsProgram: ADDRESS_OF.get('rewardsProgram')!,
};

function feeLayoutInstruction(name: LayoutDependentInstructionName): Instruction {
  const accounts = Object.keys(FEE_LAYOUT_ACCOUNTS[name]).map((account) => ({
    address: ADDRESS_OF.get(account) as Address,
    role: AccountRole.READONLY,
  }));
  return { programAddress: AddressFactory.create(1), accounts, data: new Uint8Array([7]) };
}

const accountNames = (instruction: Pick<Instruction, 'accounts'>) =>
  (instruction.accounts ?? []).map(({ address }) => NAME_OF.get(address));

describe.each(['list', 'assign', 'extend'] as const)('%s layouts', (name) => {
  it('rewrites the fee layout into the legacy account order', () => {
    const legacy = toLegacyLayout(name, feeLayoutInstruction(name), REWARDS);
    expect(accountNames(legacy)).toEqual(LEGACY_ACCOUNT_ORDER[name]);
  });

  it('marks the inserted rewards reflection and vault writable', () => {
    const legacy = toLegacyLayout(name, feeLayoutInstruction(name), REWARDS);
    const role = (account: string) =>
      legacy.accounts.find(({ address }) => address === ADDRESS_OF.get(account))?.role;
    expect(role('rewardsReflection')).toBe(AccountRole.WRITABLE);
    expect(role('rewardsVault')).toBe(AccountRole.WRITABLE);
    expect(role('rewardsProgram')).toBe(AccountRole.READONLY);
  });

  it('keeps the instruction data', () => {
    const fee = feeLayoutInstruction(name);
    expect(toLegacyLayout(name, fee, REWARDS).data).toBe(fee.data);
  });

  it('rewrites a legacy instruction back into the fee layout', () => {
    const fee = feeLayoutInstruction(name);
    expect(toFeeLayout(name, toLegacyLayout(name, fee, REWARDS))).toEqual(fee);
  });

  it('leaves a fee layout instruction unchanged', () => {
    const fee = feeLayoutInstruction(name);
    expect(toFeeLayout(name, fee)).toBe(fee);
  });
});
