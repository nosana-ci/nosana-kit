export type SshProxyMode = 'socat' | 'nc';

export interface SshConnectionOptions {
  job: string;
  node: string;
  nodeDomain: string;
  proxyPort?: string | number;
  proxyMode?: SshProxyMode;
  identityFile?: string;
  op?: string;
}

export interface SshConnectionDescriptor {
  executable: 'ssh';
  username: string;
  hostname: string;
  proxyCommand: string;
  args: string[];
  formattedCommand: string;
}

function shellQuote(value: string): string {
  if (/^[A-Za-z0-9_/:=.,%+@-]+$/.test(value)) return value;
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

export function formatSshCommand(executable: string, args: string[]): string {
  return [executable, ...args].map(shellQuote).join(' ');
}

export function createSshConnection(options: SshConnectionOptions): SshConnectionDescriptor {
  const proxyMode = options.proxyMode ?? 'socat';
  const proxyPort = options.proxyPort ?? 5002;
  const username = `nosana-${options.job}`;
  const hostname = `${options.node}-ssh.${options.nodeDomain}`;
  const proxyCommand =
    proxyMode === 'nc'
      ? `nc -X connect -x ${options.nodeDomain}:${proxyPort} %h %p`
      : `socat - PROXY:${options.nodeDomain}:%h:%p,proxyport=${proxyPort}`;
  const args = ['-o', 'StrictHostKeyChecking=accept-new', '-o', `ProxyCommand=${proxyCommand}`];

  if (options.identityFile) args.push('-i', options.identityFile);
  if (options.op) args.push('-t');
  args.push(`${username}@${hostname}`);
  if (options.op) args.push(options.op);

  return {
    executable: 'ssh',
    username,
    hostname,
    proxyCommand,
    args,
    formattedCommand: formatSshCommand('ssh', args),
  };
}
