import type { Address, Instruction } from '@solana/kit';
import {
  parseAssignInstruction,
  parseCloseInstruction,
  parseCompleteInstruction,
  parseDelistInstruction,
  parseEndInstruction,
  parseExtendInstruction,
  parseFinishInstruction,
  parseListInstruction,
  parseOpenInstruction,
  parseQuitInstruction,
  parseStopInstruction,
  parseWorkInstruction,
} from '@nosana/jobs-program';
import type { JobsInstructionName } from './computeUnits.generated.js';
import { getJobsInstructionName } from './discriminators.js';

/** A decoded jobs instruction: its name plus its labelled accounts and arguments. */
export interface DecodedJobsInstruction {
  /** The jobs instruction name (e.g. `'list'`, `'delist'`). */
  name: JobsInstructionName;
  /**
   * The instruction's accounts keyed by their program-defined role name
   * (e.g. `accounts.job`, `accounts.run`, `accounts.market`).
   */
  accounts: Record<string, Address>;
  /** The decoded instruction arguments (values may include `bigint`). */
  data: Record<string, unknown>;
}

// The subset of each generated `parseXInstruction` result we rely on.
type ParsedInstruction = {
  accounts: Record<string, { address: Address }>;
  data: Record<string, unknown>;
};
type InstructionParser = (instruction: Instruction) => ParsedInstruction;

// name -> generated parser. The casts bridge each parser's specific generic
// signature to a uniform one; we only ever call the parser matched by name.
const PARSERS: Record<JobsInstructionName, InstructionParser> = {
  open: parseOpenInstruction as unknown as InstructionParser,
  list: parseListInstruction as unknown as InstructionParser,
  assign: parseAssignInstruction as unknown as InstructionParser,
  work: parseWorkInstruction as unknown as InstructionParser,
  complete: parseCompleteInstruction as unknown as InstructionParser,
  finish: parseFinishInstruction as unknown as InstructionParser,
  quit: parseQuitInstruction as unknown as InstructionParser,
  stop: parseStopInstruction as unknown as InstructionParser,
  extend: parseExtendInstruction as unknown as InstructionParser,
  delist: parseDelistInstruction as unknown as InstructionParser,
  close: parseCloseInstruction as unknown as InstructionParser,
  end: parseEndInstruction as unknown as InstructionParser,
};

/**
 * Decode a jobs instruction into its name and labelled accounts/arguments.
 *
 * This is what lets a bulk `sendBatch` caller recover the accounts an instruction
 * created or acted on — for example the freshly generated `job` and `run`
 * addresses of a `list` — without threading that state through by hand. Account
 * keys match the program's account names.
 *
 * @param instruction The instruction to decode.
 * @returns The decoded instruction, or `undefined` if it is not a recognised
 *   jobs instruction (or cannot be decoded).
 * @group @nosana/kit
 */
export function decodeJobsInstruction(
  instruction: Instruction
): DecodedJobsInstruction | undefined {
  const name = getJobsInstructionName(instruction);
  if (!name) return undefined;
  try {
    const parsed = PARSERS[name](instruction);
    const accounts: Record<string, Address> = {};
    for (const [role, meta] of Object.entries(parsed.accounts)) {
      accounts[role] = meta.address;
    }
    return { name, accounts, data: parsed.data };
  } catch {
    return undefined;
  }
}
