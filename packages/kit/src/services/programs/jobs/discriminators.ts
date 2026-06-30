import { getBase16Decoder, type Instruction, type ReadonlyUint8Array } from '@solana/kit';
import {
  ASSIGN_DISCRIMINATOR,
  CLOSE_DISCRIMINATOR,
  COMPLETE_DISCRIMINATOR,
  DELIST_DISCRIMINATOR,
  END_DISCRIMINATOR,
  EXTEND_DISCRIMINATOR,
  FINISH_DISCRIMINATOR,
  LIST_DISCRIMINATOR,
  OPEN_DISCRIMINATOR,
  QUIT_DISCRIMINATOR,
  STOP_DISCRIMINATOR,
  WORK_DISCRIMINATOR,
} from '@nosana/jobs-program';
import type { JobsInstructionName } from './computeUnits.generated.js';

/** The number of leading bytes that make up an Anchor instruction discriminator. */
export const DISCRIMINATOR_LENGTH = 8;

/** The 8-byte Anchor discriminator for each named jobs instruction. */
export const DISCRIMINATORS: Record<JobsInstructionName, ReadonlyUint8Array> = {
  open: OPEN_DISCRIMINATOR,
  list: LIST_DISCRIMINATOR,
  assign: ASSIGN_DISCRIMINATOR,
  work: WORK_DISCRIMINATOR,
  complete: COMPLETE_DISCRIMINATOR,
  finish: FINISH_DISCRIMINATOR,
  quit: QUIT_DISCRIMINATOR,
  stop: STOP_DISCRIMINATOR,
  extend: EXTEND_DISCRIMINATOR,
  delist: DELIST_DISCRIMINATOR,
  close: CLOSE_DISCRIMINATOR,
  end: END_DISCRIMINATOR,
};

const base16 = getBase16Decoder();

/** Hex-encode the first {@link DISCRIMINATOR_LENGTH} bytes of a byte array. */
export function discriminatorHex(bytes: ReadonlyUint8Array): string {
  return base16.decode(bytes.slice(0, DISCRIMINATOR_LENGTH));
}

// hex(discriminator) -> instruction name, built once from the table above.
const NAME_BY_DISCRIMINATOR = new Map<string, JobsInstructionName>(
  (Object.keys(DISCRIMINATORS) as JobsInstructionName[]).map((name) => [
    discriminatorHex(DISCRIMINATORS[name]),
    name,
  ])
);

/**
 * Identify a jobs instruction by matching its 8-byte Anchor discriminator.
 *
 * Works on any raw {@link Instruction} regardless of how it was built, so it can
 * identify instructions in a mixed batch. Returns `undefined` for instructions
 * that are not recognised jobs instructions.
 *
 * @param instruction The instruction to identify.
 * @returns The jobs instruction name, or `undefined` if unrecognised.
 * @group @nosana/kit
 */
export function getJobsInstructionName(instruction: Instruction): JobsInstructionName | undefined {
  const data = instruction.data;
  if (!data || data.length < DISCRIMINATOR_LENGTH) return undefined;
  return NAME_BY_DISCRIMINATOR.get(discriminatorHex(data));
}
