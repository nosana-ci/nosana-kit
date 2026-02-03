import { NosanaError, ErrorCodes } from '../errors/NosanaError.js';

/**
 * URL protocol constants
 */
export const PROTOCOL = {
  HTTP: 'http',
  HTTPS: 'https',
  WS: 'ws',
  WSS: 'wss',
} as const;

/**
 * Converts an HTTP/HTTPS URL to a WebSocket URL (ws/wss).
 * Replaces the protocol: http -> ws, https -> wss
 *
 * @param httpUrl The HTTP or HTTPS URL to convert
 * @returns The WebSocket URL with the protocol replaced
 * @throws NosanaError if the URL doesn't use HTTP/HTTPS protocol
 * @throws TypeError if the URL is invalid
 *
 * @example
 * ```ts
 * convertHttpToWebSocketUrl('https://api.mainnet-beta.solana.com')
 * // Returns: 'wss://api.mainnet-beta.solana.com'
 *
 * convertHttpToWebSocketUrl('http://localhost:8899')
 * // Returns: 'ws://localhost:8899'
 * ```
 */
export function convertHttpToWebSocketUrl(httpUrl: string): string {
  const url = new URL(httpUrl);

  if (!url.protocol.match(/^https?:$/i)) {
    throw new NosanaError(
      `Unsupported protocol: ${url.protocol}. Only HTTP and HTTPS are supported.`,
      ErrorCodes.VALIDATION_ERROR
    );
  }

  url.protocol = url.protocol.replace(PROTOCOL.HTTP, PROTOCOL.WS);
  return url.toString();
}
