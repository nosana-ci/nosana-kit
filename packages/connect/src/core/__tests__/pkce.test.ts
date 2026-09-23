import { describe, expect, it } from 'vitest';
import {
  base64UrlEncode,
  codeChallengeS256,
  generateCodeVerifier,
  randomString,
} from '../pkce.js';

describe('pkce', () => {
  it('generates a base64url verifier with no padding', () => {
    const v = generateCodeVerifier();
    expect(v).toMatch(/^[A-Za-z0-9\-_]+$/);
    expect(v).not.toContain('=');
    expect(v.length).toBeGreaterThanOrEqual(43);
  });

  it('produces the RFC 7636 Appendix B challenge for the known verifier', async () => {
    const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
    const challenge = await codeChallengeS256(verifier);
    expect(challenge).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
  });

  it('base64UrlEncode uses the url-safe alphabet without padding', () => {
    expect(base64UrlEncode(new Uint8Array([0, 0, 0]))).toBe('AAAA');
    expect(base64UrlEncode(new Uint8Array([251, 255, 191]))).toBe('-_-_');
  });

  it('randomString is unique across calls', () => {
    expect(randomString(16)).not.toBe(randomString(16));
  });
});
