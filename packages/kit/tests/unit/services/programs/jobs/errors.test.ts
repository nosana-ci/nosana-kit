import { describe, expect, it } from 'vitest';
import { ErrorCodes, NosanaError } from '../../../../../src/errors/NosanaError.js';
import {
  getSolanaErrorFromJsonRpcError,
  getSolanaErrorFromTransactionError,
  SolanaError,
  SOLANA_ERROR__ACCOUNTS__ACCOUNT_NOT_FOUND,
} from '@solana/kit';

import { isRunClosedError } from '../../../../../src/services/programs/jobs/index.js';
import { AddressFactory } from '../../../setup/index.js';

/** A failed send, as buildSignAndSend throws it. */
const sendFailed = (error: Error) =>
  new NosanaError(
    `Failed to send transaction sig: ${error.message}`,
    ErrorCodes.RPC_ERROR,
    error,
    'sig'
  );

/** A simulation that failed with `err`, as @solana/kit makes it of the RPC's answer. */
const preflightFailed = (err: unknown, logs: string[] = []) =>
  getSolanaErrorFromJsonRpcError({
    code: -32002,
    message: 'Transaction simulation failed',
    data: { err, logs, accounts: null, unitsConsumed: 1000, returnData: null },
  });

const ANCHOR_LOG =
  'Program log: AnchorError caused by account: run. Error Code: AccountNotInitialized. ' +
  'Error Number: 3012. Error Message: The program expected this account to be already initialized.';

/**
 * A submit for a run that is already closed onchain: the old SDK's Anchor
 * errors, and what the kit and @solana/kit throw for the same.
 */
describe('isRunClosedError', () => {
  it('knows the old SDK’s errors', () => {
    expect(isRunClosedError(new Error('AnchorError: AccountNotInitialized'))).toBe(true);
    expect(isRunClosedError(new Error('Account does not exist or has no data abc'))).toBe(true);
  });

  it('knows finish finding no run for the job', () => {
    expect(
      isRunClosedError(
        new Error(
          'Failed to create finish instruction: No job run account found for the specified job'
        )
      )
    ).toBe(true);
  });

  it('knows a simulation that failed on AccountNotInitialized', () => {
    const error = sendFailed(preflightFailed({ InstructionError: [1, { Custom: 3012 }] }));

    expect(isRunClosedError(error)).toBe(true);
  });

  it('knows a simulation whose logs tell of AccountNotInitialized', () => {
    expect(isRunClosedError(sendFailed(preflightFailed(undefined, [ANCHOR_LOG])))).toBe(true);
  });

  it('knows a transaction that failed on AccountNotInitialized once sent', () => {
    const error = sendFailed(
      getSolanaErrorFromTransactionError({ InstructionError: [1, { Custom: 3012 }] }) as Error
    );

    expect(isRunClosedError(error)).toBe(true);
  });

  it('knows an account that is not there', () => {
    const error = new SolanaError(SOLANA_ERROR__ACCOUNTS__ACCOUNT_NOT_FOUND, {
      address: AddressFactory.create(),
    });

    expect(isRunClosedError(error)).toBe(true);
    // finish keeps only the message, worded so under NODE_ENV=production
    expect(
      isRunClosedError(
        new Error(
          'Failed to create finish instruction: Solana error #3230000; Decode this error by running `npx @solana/errors decode -- 3230000`'
        )
      )
    ).toBe(true);
  });

  it('leaves any other failure to be retried', () => {
    expect(isRunClosedError(new Error('blockhash not found'))).toBe(false);
    expect(
      isRunClosedError(sendFailed(preflightFailed({ InstructionError: [1, { Custom: 6000 }] })))
    ).toBe(false);
    // a fee payer without SOL is not a closed run
    expect(isRunClosedError(sendFailed(preflightFailed('AccountNotFound')))).toBe(false);
    expect(isRunClosedError(undefined)).toBe(false);
  });
});
