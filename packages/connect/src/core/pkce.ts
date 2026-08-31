// PKCE (RFC 7636) + CSRF/nonce helpers. Environment-agnostic: relies only on
// the Web Crypto API (crypto.getRandomValues / crypto.subtle) and btoa, which
// are globals in browsers and Node 20+.

const encoder = new TextEncoder();

/** Base64url-encode bytes with no padding (RFC 4648 §5). */
export function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Cryptographically random base64url string from `size` bytes of entropy. */
export function randomString(size = 32): string {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

/** A PKCE code_verifier: 43 base64url chars from 32 bytes of entropy. */
export function generateCodeVerifier(): string {
  return randomString(32);
}

/** The S256 code_challenge for a given verifier. */
export async function codeChallengeS256(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(verifier));
  return base64UrlEncode(new Uint8Array(digest));
}
