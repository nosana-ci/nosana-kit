import { createSolanaRpc } from '@solana/kit';

import type {
  PriorityFeesConfig,
  PriorityFeesConfigDynamic,
  PriorityFeeStrategy,
} from '../../config/types.js';
import type { Logger } from '../../logger/Logger.js';

/** Default percentile when neither strategy nor percentile is set (matches legacy priorityFeeStrategy: 'medium'). */
const DEFAULT_DYNAMIC_PERCENTILE = 50;

const STRATEGY_PERCENTILE: Record<PriorityFeeStrategy, number> = {
  low: 25,
  medium: 50,
  high: 75,
};

/**
 * Resolve priority fee microLamports from config (fixed or dynamic).
 * Dynamic: uses strategy or percentile from config; on empty or error falls back to config min (or 0).
 * No defaults here—use defaultConfigs when initializing the client to get full priority fee defaults.
 */
export async function resolvePriorityFeeMicroLamports(
  priorityFees: PriorityFeesConfig,
  rpc: ReturnType<typeof createSolanaRpc>,
  logger?: Logger
): Promise<bigint> {
  if (priorityFees.type === 'fixed') {
    return BigInt(priorityFees.microLamports);
  }
  const dynamic = priorityFees as PriorityFeesConfigDynamic;
  const fallbackMicroLamports = BigInt(dynamic.min ?? 0);

  try {
    const accountAddresses = dynamic.accountAddresses ?? [];

    const recentFees = await rpc.getRecentPrioritizationFees(accountAddresses).send();

    if (!recentFees?.length) {
      logger?.debug(
        `No recent prioritization fees found, using min as fallback: ${fallbackMicroLamports} microLamports`
      );
      return fallbackMicroLamports;
    }

    const fees = [...recentFees]
      .map((f) =>
        typeof f.prioritizationFee === 'bigint' ? f.prioritizationFee : BigInt(f.prioritizationFee)
      )
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

    const percentile =
      dynamic.percentile !== undefined && dynamic.percentile !== null
        ? Math.min(100, Math.max(0, dynamic.percentile))
        : dynamic.strategy !== undefined
          ? STRATEGY_PERCENTILE[dynamic.strategy]
          : DEFAULT_DYNAMIC_PERCENTILE;

    const index = Math.min(fees.length - 1, Math.floor((percentile / 100) * (fees.length - 0.01)));
    let microLamports = fees[index] ?? 0n;
    if (dynamic.min !== undefined && microLamports < BigInt(dynamic.min)) {
      microLamports = BigInt(dynamic.min);
    }
    if (dynamic.max !== undefined && microLamports > BigInt(dynamic.max)) {
      microLamports = BigInt(dynamic.max);
    }
    return microLamports;
  } catch (err) {
    logger?.warn(
      `Priority fee fetch failed, using min as fallback: ${fallbackMicroLamports} microLamports. Error: ${err}`
    );
    return fallbackMicroLamports;
  }
}
