import { type AccountMeta, type Address, type Instruction, AccountRole } from '@solana/kit';
import {
  ASSIGN_INSTRUCTION_ACCOUNTS,
  EXTEND_INSTRUCTION_ACCOUNTS,
  LIST_INSTRUCTION_ACCOUNTS,
} from '@nosana/jobs-program';

/**
 * The jobs instructions whose accounts differ between the program releases. The `legacy` layout
 * routes the network fee through the rewards program and takes its accounts; the `fee` layout,
 * which the generated client builds, does not. The instruction data is the same in both.
 */
export type LayoutDependentInstructionName = keyof typeof FEE_LAYOUT_ACCOUNTS;

/** A generated instruction rewritten into the `legacy` layout, which no longer matches its account tuple. */
export type LegacyLayout<T extends Instruction> = Omit<T, 'accounts'> & {
  accounts: readonly AccountMeta[];
};

export type RewardsAccounts = {
  rewardsReflection: Address;
  rewardsVault: Address;
  rewardsProgram: Address;
};

const FEE_LAYOUT_ACCOUNTS = {
  list: LIST_INSTRUCTION_ACCOUNTS,
  assign: ASSIGN_INSTRUCTION_ACCOUNTS,
  extend: EXTEND_INSTRUCTION_ACCOUNTS,
};

const REWARDS_ACCOUNT_COUNT = 3;

/**
 * Rewrite a `fee` layout instruction into the `legacy` layout: the rewards reflection and
 * vault go before `authority`, the rewards program before `tokenProgram`.
 */
export function toLegacyLayout<T extends Instruction>(
  name: LayoutDependentInstructionName,
  instruction: T,
  rewards: RewardsAccounts
): LegacyLayout<T> {
  const { authority, tokenProgram } = FEE_LAYOUT_ACCOUNTS[name];
  const accounts = instruction.accounts ?? [];
  return {
    ...instruction,
    accounts: [
      ...accounts.slice(0, authority),
      { address: rewards.rewardsReflection, role: AccountRole.WRITABLE },
      { address: rewards.rewardsVault, role: AccountRole.WRITABLE },
      ...accounts.slice(authority, tokenProgram),
      { address: rewards.rewardsProgram, role: AccountRole.READONLY },
      ...accounts.slice(tokenProgram),
    ],
  };
}

/**
 * Rewrite a `legacy` layout instruction into the `fee` layout, so the generated parsers label
 * its accounts correctly. Instructions already in the `fee` layout are returned unchanged.
 */
export function toFeeLayout(
  name: LayoutDependentInstructionName,
  instruction: Instruction
): Instruction {
  const layout = FEE_LAYOUT_ACCOUNTS[name];
  const accounts = instruction.accounts ?? [];
  if (accounts.length !== Object.keys(layout).length + REWARDS_ACCOUNT_COUNT) return instruction;

  // In the legacy layout the rewards program sits after the two inserted accounts.
  const rewardsIndices = [layout.authority, layout.authority + 1, layout.tokenProgram + 2];
  return {
    ...instruction,
    accounts: accounts.filter((_, index) => !rewardsIndices.includes(index)),
  };
}

export function isLayoutDependent(name: string): name is LayoutDependentInstructionName {
  return Object.prototype.hasOwnProperty.call(FEE_LAYOUT_ACCOUNTS, name);
}
