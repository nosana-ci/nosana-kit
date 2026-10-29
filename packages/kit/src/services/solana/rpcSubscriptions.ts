import {
  createDefaultRpcSubscriptionsTransport,
  createSolanaRpcSubscriptionsFromTransport,
  getChannelPoolingChannelCreator,
  getRpcSubscriptionsChannelWithAutoping,
  getRpcSubscriptionsChannelWithBigIntJSONSerialization,
  isSolanaError,
  RpcSubscriptions,
  RpcSubscriptionsChannel,
  RpcSubscriptionsChannelCreator,
  SOLANA_ERROR__RPC_SUBSCRIPTIONS__CHANNEL_CONNECTION_CLOSED,
  SolanaRpcSubscriptionsApi,
} from '@solana/kit';
import { createWebSocketChannel } from '@solana/rpc-subscriptions-channel-websocket';

/** The options of @solana/kit's `createSolanaRpcSubscriptions`, with its defaults. */
export type RpcSubscriptionsConfig = Readonly<{
  /** How often the channel is pinged while idle. */
  intervalMs?: number;
  maxSubscriptionsPerChannel?: number;
  minChannels?: number;
  sendBufferHighWatermark?: number;
}>;

/**
 * The channel with a connection found closed reported to its error listeners.
 *
 * @solana/kit's WebSocket channel reports a dropped connection as an error,
 * which ends every subscription on it, so whoever holds one can subscribe
 * again. A connection the server closes normally (close code 1000) is, by its
 * design, no error: nothing is reported, and the subscriptions on that
 * channel stay open, and silent, for good. The channel does refuse to send on
 * a closed connection, whatever closed it, and @solana/kit's autopinger sends
 * on it while it is idle: this passes that refusal on to the error listeners,
 * so the subscriptions end as they do after a drop. It changes nothing else
 * about the channel.
 */
function getRpcSubscriptionsChannelReportingClosure<
  TChannel extends RpcSubscriptionsChannel<unknown, unknown>,
>(channel: TChannel, abortSignal: AbortSignal): TChannel {
  const listeners = new Set<(error: unknown) => void>();
  let reported = false;

  return {
    ...channel,
    on(channelName, subscriber, options) {
      const unsubscribe = channel.on(channelName, subscriber, options);
      if (channelName !== 'error') return unsubscribe;
      const listener = subscriber as (error: unknown) => void;
      listeners.add(listener);
      options?.signal.addEventListener('abort', () => listeners.delete(listener), { once: true });
      return () => {
        unsubscribe();
        listeners.delete(listener);
      };
    },
    async send(message: unknown) {
      try {
        await channel.send(message);
      } catch (error) {
        if (
          !reported &&
          !abortSignal.aborted &&
          isSolanaError(error, SOLANA_ERROR__RPC_SUBSCRIPTIONS__CHANNEL_CONNECTION_CLOSED)
        ) {
          reported = true;
          for (const listener of [...listeners]) listener(error);
        }
        throw error;
      }
    },
  } as TChannel;
}

/**
 * The Solana RPC subscriptions @solana/kit's `createSolanaRpcSubscriptions`
 * makes, built from the same layers with the same defaults, with one more
 * between the channel and the autopinger: a connection the server closed
 * normally ends the subscriptions on it, as a dropped one does.
 * @group @nosana/kit
 */
export function createRpcSubscriptions(
  url: string,
  config: RpcSubscriptionsConfig = {}
): RpcSubscriptions<SolanaRpcSubscriptionsApi> {
  if (/^wss?:/i.test(url) === false) {
    const protocolMatch = url.match(/^([^:]+):/);
    throw new DOMException(
      protocolMatch
        ? `Failed to construct 'WebSocket': The URL's scheme must be either 'ws' or 'wss'. '${protocolMatch[1]}:' is not allowed.`
        : `Failed to construct 'WebSocket': The URL '${url}' is invalid.`
    );
  }

  const createChannel: RpcSubscriptionsChannelCreator<unknown, unknown> = ({ abortSignal }) =>
    createWebSocketChannel({
      // Let 128KB of data into the WebSocket buffer before buffering it in the app.
      sendBufferHighWatermark: config.sendBufferHighWatermark ?? 131072,
      signal: abortSignal,
      url,
    })
      .then(getRpcSubscriptionsChannelWithBigIntJSONSerialization)
      .then((channel) =>
        getRpcSubscriptionsChannelWithAutoping({
          abortSignal,
          channel: getRpcSubscriptionsChannelReportingClosure(
            channel,
            abortSignal
          ) as RpcSubscriptionsChannel<object, unknown>,
          intervalMs: config.intervalMs ?? 5_000,
        })
      );

  const transport = createDefaultRpcSubscriptionsTransport({
    createChannel: getChannelPoolingChannelCreator(createChannel, {
      // The lowest known RPC provider limit, as of October 2024 (api.mainnet-beta.solana.com).
      maxSubscriptionsPerChannel: config.maxSubscriptionsPerChannel ?? 100,
      minChannels: config.minChannels ?? 1,
    }),
  });
  return createSolanaRpcSubscriptionsFromTransport(transport);
}
