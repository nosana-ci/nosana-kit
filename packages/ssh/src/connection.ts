import type { SshCommandOptions, SshConnectionDescriptor, SshJobTarget } from './types.js';

const DEFAULT_PROXY_PORT = 5002;

/** The only user name a job's SSH sidecar accepts; the hostname names the job. */
export const SSH_USERNAME = 'nosana';

/** The hostname of one operation's SSH sidecar, as published through the node's proxy. */
export function sshHostname(target: SshJobTarget, opIndex = 0): string {
  if (!Number.isInteger(opIndex) || opIndex < 0) {
    throw new Error('SSH operation index must be a non-negative integer.');
  }
  return `${target.job}-${opIndex}-ssh.${target.nodeDomain}`;
}

/** Describes the `ssh` invocation that reaches a job through its node's proxy. */
export function createSshCommand(
  target: SshJobTarget,
  options: SshCommandOptions = {}
): SshConnectionDescriptor {
  const username = SSH_USERNAME;
  const hostname = sshHostname(target, options.opIndex);
  const proxyCommand = proxyCommandFor(target.nodeDomain, options);
  const args = [
    '-o',
    'StrictHostKeyChecking=accept-new',
    '-o',
    `ProxyCommand=${proxyCommand}`,
    ...(options.identityFile ? ['-i', options.identityFile] : []),
    `${username}@${hostname}`,
  ];

  return {
    executable: 'ssh',
    username,
    hostname,
    proxyCommand,
    args,
    formattedCommand: formatSshCommand('ssh', args),
  };
}

function proxyCommandFor(
  nodeDomain: string,
  { proxyMode = 'socat', proxyPort = DEFAULT_PROXY_PORT }: SshCommandOptions
): string {
  return proxyMode === 'nc'
    ? `nc -X connect -x ${nodeDomain}:${proxyPort} %h %p`
    : `socat - PROXY:${nodeDomain}:%h:%p,proxyport=${proxyPort}`;
}

/** Joins an executable and its arguments into a POSIX shell command that can be pasted as is. */
export function formatSshCommand(executable: string, args: string[]): string {
  return [executable, ...args].map(shellQuote).join(' ');
}

function shellQuote(value: string): string {
  return /^[A-Za-z0-9_/:=.,%+@-]+$/.test(value) ? value : `'${value.replace(/'/g, `'\\''`)}'`;
}
