import {
  isSolanaError,
  SOLANA_ERROR__ACCOUNTS__ACCOUNT_NOT_FOUND,
  SOLANA_ERROR__INSTRUCTION_ERROR__CUSTOM,
  SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE,
} from '@solana/kit';

/**
 * Anchor's AccountNotInitialized, as a custom program error: the program was
 * handed an account that is not there, the run once it is closed.
 */
const ACCOUNT_NOT_INITIALIZED = 3012;

/**
 * What a closed run reads as in an error's message, or in the logs of the
 * transaction it failed: Anchor's AccountNotInitialized (in its logs, and as
 * the old SDK put it), the old SDK's fetch of an account that is not there,
 * `finish` finding no run for the job, and @solana/kit's fetch of an account
 * that is not there (as NODE_ENV=production words it too).
 */
const RUN_CLOSED_MESSAGES = [
  'AccountNotInitialized',
  'The program expected this account to be already initialized',
  'Account does not exist or has no data',
  'No job run account found',
  'Account not found at address',
  `Solana error #${SOLANA_ERROR__ACCOUNTS__ACCOUNT_NOT_FOUND};`,
];

const isRunClosedMessage = (message: string) =>
  RUN_CLOSED_MESSAGES.some((closed) => message.includes(closed));

/**
 * Whether a job's `finish`, `complete` or `quit` failed because its run is
 * already closed onchain: there is nothing left to submit, and nothing to
 * retry. A NosanaError keeps what @solana/kit threw as `details`, which keeps
 * the error it was caused by (`cause`): a failed simulation by the
 * instruction error, with the transaction's logs. Each error down that chain
 * is looked at.
 * @group @nosana/kit
 */
export function isRunClosedError(error: unknown): boolean {
  const seen = new Set<unknown>();
  for (let current = error; current != null && !seen.has(current); ) {
    seen.add(current);

    if (
      isSolanaError(current, SOLANA_ERROR__INSTRUCTION_ERROR__CUSTOM) &&
      current.context.code === ACCOUNT_NOT_INITIALIZED
    ) {
      return true;
    }
    if (isSolanaError(current, SOLANA_ERROR__ACCOUNTS__ACCOUNT_NOT_FOUND)) return true;
    if (
      isSolanaError(
        current,
        SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE
      ) &&
      current.context.logs?.some(isRunClosedMessage)
    ) {
      return true;
    }
    if (isRunClosedMessage(current instanceof Error ? current.message : String(current))) {
      return true;
    }

    const { cause, details } = current as { cause?: unknown; details?: unknown };
    current = cause ?? details;
  }
  return false;
}
