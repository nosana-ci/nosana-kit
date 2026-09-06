/** The job an SSH command reaches, and the node that runs it. */
export interface SshJobTarget {
  job: string;
  node: string;
  /** The proxy domain of the node's network; the sidecar hostname hangs under it. */
  nodeDomain: string;
}

export type SshProxyMode = 'socat' | 'nc';

/** How the local `ssh` client should reach the node's proxy. */
export interface SshCommandOptions {
  /** Port of the node's CONNECT proxy; defaults to 5002. */
  proxyPort?: string | number;
  /** Which local tool tunnels through the proxy; defaults to `socat`. */
  proxyMode?: SshProxyMode;
  /** The private key to connect with, passed to `ssh -i`. */
  identityFile?: string;
  /**
   * Which operation of the job to reach, as its position in the job
   * definition's `ops`; every operation has its own SSH sidecar. Defaults to 0.
   */
  opIndex?: number;
}

export interface SshConnectionDescriptor {
  executable: 'ssh';
  username: string;
  hostname: string;
  proxyCommand: string;
  args: string[];
  /** The full command, shell-quoted for copy and paste. */
  formattedCommand: string;
}

/** A source of cryptographically secure random bytes, such as Web Crypto. */
export interface SshCryptoProvider {
  getRandomValues<T extends ArrayBufferView>(array: T): T;
}

export interface GenerateSshKeyPairOptions {
  /** Trailing comment of the public key; defaults to `nosana`. */
  comment?: string;
  /** Defaults to `globalThis.crypto`. */
  cryptoProvider?: SshCryptoProvider;
}

export interface SshKeyPair {
  algorithm: 'ssh-ed25519';
  /** One OpenSSH `authorized_keys` line. */
  publicKey: string;
  /** PEM-wrapped, unencrypted OpenSSH private key. */
  privateKey: string;
}

export type SshPublicKeyParseErrorCode = 'INVALID_KEY' | 'TOO_MANY_KEYS' | 'KEY_SET_TOO_LARGE';

export interface SshPublicKeyParseError {
  code: SshPublicKeyParseErrorCode;
  /** 1-based line of the offending key; absent for whole-set errors. */
  line?: number;
  message: string;
}

export interface SshPublicKeyParseResult {
  keys: string[];
  errors: SshPublicKeyParseError[];
}
