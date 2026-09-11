import { describe, expect, it } from 'vitest';

import { createSshCommand, formatSshCommand, sshHostname } from '../connection.js';

const target = { job: 'job-address', node: 'node-address', nodeDomain: 'node.example.com' };

describe('createSshCommand', () => {
  it('tunnels through socat by default', () => {
    const connection = createSshCommand(target);

    expect(connection).toMatchObject({
      executable: 'ssh',
      username: 'nosana',
      hostname: 'job-address-0-ssh.node.example.com',
      proxyCommand: 'socat - PROXY:node.example.com:%h:%p,proxyport=5002',
    });
    expect(connection.args).toEqual([
      '-o',
      'StrictHostKeyChecking=accept-new',
      '-o',
      'ProxyCommand=socat - PROXY:node.example.com:%h:%p,proxyport=5002',
      'nosana@job-address-0-ssh.node.example.com',
    ]);
    expect(connection.formattedCommand).toBe(
      "ssh -o StrictHostKeyChecking=accept-new -o 'ProxyCommand=socat - PROXY:node.example.com:%h:%p,proxyport=5002' nosana@job-address-0-ssh.node.example.com"
    );
  });

  it('reaches another operation through its own sidecar hostname', () => {
    expect(sshHostname(target, 2)).toBe('job-address-2-ssh.node.example.com');
    expect(createSshCommand(target, { opIndex: 2 }).hostname).toBe(
      'job-address-2-ssh.node.example.com'
    );
    expect(() => createSshCommand(target, { opIndex: -1 })).toThrow('operation index');
    expect(() => createSshCommand(target, { opIndex: 1.5 })).toThrow('operation index');
  });

  it('supports nc with a custom proxy port', () => {
    const connection = createSshCommand(target, { proxyMode: 'nc', proxyPort: '8080' });
    expect(connection.proxyCommand).toBe('nc -X connect -x node.example.com:8080 %h %p');
  });

  it('adds the identity file before the destination', () => {
    const { args } = createSshCommand(target, { identityFile: '~/.ssh/id' });
    expect(args.slice(4)).toEqual(['-i', '~/.ssh/id', 'nosana@job-address-0-ssh.node.example.com']);
  });
});

describe('formatSshCommand', () => {
  it('quotes only arguments the shell would otherwise interpret', () => {
    expect(formatSshCommand('ssh', ['-i', '/a/b', "it's", 'a b'])).toBe(
      "ssh -i /a/b 'it'\\''s' 'a b'"
    );
  });
});
