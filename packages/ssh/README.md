# @nosana/ssh

The local side of SSH access to Nosana jobs, with no network code:

- generate OpenSSH Ed25519 key pairs in any runtime with Web Crypto;
- validate and parse `authorized_keys`-style public keys with the node's limits;
- read and update the SSH keys of a job definition;
- describe the `ssh` command that reaches a job through its node's proxy.

Talking to a node, which is where keys are granted and web terminals open,
lives in `@nosana/api` under `api.jobs(job)`. The kit exposes it as
`client.api.jobs(job)` and re-exports this package's tools.

## Install

```bash
pnpm add @nosana/ssh
```

## Usage

```ts
import {
  createSshCommand,
  generateSshKeyPair,
  parseSshPublicKeys,
  withSshPublicKeys,
} from '@nosana/ssh';

const pair = await generateSshKeyPair({ comment: 'laptop' });

const { keys, errors } = parseSshPublicKeys(authorizedKeysText);
const definition = withSshPublicKeys(jobDefinition, keys);

const command = createSshCommand(
  { job: jobAddress, node: nodeAddress, nodeDomain: 'node.k8s.prd.nos.ci' },
  { identityFile: '~/.ssh/id_ed25519' }, // the private half of the key the node was given
);
console.log(command.formattedCommand);
// ssh ... nosana@<jobAddress>-0-ssh.node.k8s.prd.nos.ci
```

Every operation of a job has its own SSH sidecar; `opIndex` (the operation's
position in the job definition's `ops`, default 0) picks which one the command
reaches. The user is always `nosana`. Only interactive shells are served: no
remote commands, `sftp`, `scp` or forwarding.

A key line is at most one line; a job holds at most 10 keys and 64 KiB of key
data. `parseSshPublicKeys` reports every problem rather than throwing, and
`requireSshPublicKey` / `requireSshPublicKeySet` throw for callers that want
validation before sending.
