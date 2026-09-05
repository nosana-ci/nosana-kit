/**
 * The part of an OpenSSH public key that identifies it: its type and key
 * material. The trailing comment is free text, and two keys that differ only
 * there grant the same access.
 */
export function sshKeyIdentity(publicKey: string): string {
  return publicKey.trim().split(/\s+/).slice(0, 2).join(' ');
}
