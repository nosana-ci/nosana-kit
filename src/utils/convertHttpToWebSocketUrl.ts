/**
 * Converts an HTTP/HTTPS URL to a WebSocket URL (ws/wss).
 * Replaces the protocol: http -> ws, https -> wss
 *
 * @param httpUrl The HTTP or HTTPS URL to convert
 * @returns The WebSocket URL with the protocol replaced
 * @throws Error if the URL is invalid or doesn't use HTTP/HTTPS protocol
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
    throw new Error(`Unsupported protocol: ${url.protocol}. Only HTTP and HTTPS are supported.`);
  }

  url.protocol = url.protocol.replace('http', 'ws');
  return url.toString();
}
