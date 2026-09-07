# SSH access

SSH access to a job is granted on the node that runs it, and the node job API in
`@nosana/api` is how you reach that node. A node verifies the job owner's
signature; under an API key the client manager signs on your behalf, so this
works with either a wallet or an API key. (Deployments manage keys through the
deployment manager instead — see `deployment.ssh`.)

```ts
const job = await client.api.jobs('JOB_ADDRESS'); // the job's state, merged with its node job API

await job.ssh.keys(); // [{ sshPublicKey, expiresAt? }]
await job.ssh.add(publicKey); // until removed or the job ends
await job.ssh.add(publicKey, { expiresAt: new Date(Date.now() + 60_000) });
await job.ssh.remove(publicKey);
```

Key identity is the algorithm and key material; a different comment is the
same key. At most 10 keys and 64 KiB of key data are allowed per job. Removal
prevents new connections; open sessions stay until they disconnect or the job
ends.

## Connecting

Two ways in, both from the same job object:

```ts
// The ssh command to run locally; identityFile is the private half of a key you added.
const command = job.ssh.command({ identityFile: '~/.ssh/id_ed25519' });
console.log(command.formattedCommand);
// ssh ... nosana@<job>-0-ssh.node.k8s.<env>.nos.ci

// A multi-container job has one SSH sidecar per operation; pick it by its
// position in the job definition's ops.
const worker = job.ssh.command({ identityFile: '~/.ssh/id_ed25519', opIndex: 1 });

// A web terminal over the node's WebSocket, authorised by a short-lived wallet-signed grant.
const session = await job.terminal({
  cols: 120,
  rows: 40,
  onData: (bytes) => terminal.write(bytes),
  onStatus: (status, detail) => console.log(status, detail),
});
session.sendInput('ls\n');
session.close();
```

The terminal uses no SSH key. It reports `authorizing`, `connecting`,
`connected`, and then `closed` or `error` through `onStatus`; a grant that the
node would reject is refused before the socket opens.

The SSH side is served by the operation's sidecar container on the node (the
same container that publishes its endpoints), reached as `nosana@<job>-<opIndex>-ssh.<domain>`
through the node network's CONNECT proxy. Only interactive shells with a
terminal are accepted: remote commands, `sftp`, `scp` and forwarding are refused.

## Keys

Key pairs and validation come from `@nosana/ssh`, which the kit re-exports:

```ts
import { generateSshKeyPair, parseSshPublicKeys, withSshPublicKeys } from '@nosana/kit';

const pair = await generateSshKeyPair({ comment: 'laptop' });
const { keys, errors } = parseSshPublicKeys(authorizedKeysText);
const definition = withSshPublicKeys(jobDefinition, keys); // keys baked into a job definition
```

## Deployment manager integration

Deployment-level keys are managed on the deployment object under `deployment.ssh`
and pushed to running jobs by the deployment manager. When the manager acts on a
node itself it signs with the deployment wallet; the same node routes accept an
`authorizationProvider` that returns the standard `message:signature` string, so a
provider backed by `deployment.generateAuthHeader` can open a terminal or read
logs for a deployment's job:

```ts
await job.terminal({
  cols, rows, onData,
  authorizationProvider: (message) => deployment.generateAuthHeader({ message, includeTime: 'false' }),
});
```

## Node wire contract

Every request carries `Authorization: message:base58-signature` from
`@nosana/authorization`; the node checks it against the job owner. Headers are
credentials: do not log them or forward them through redirects.

| Operation | Method and path | Body |
| --- | --- | --- |
| `ssh.add` | `POST /job/:job/ssh/authorize` | `{ sshPublicKey, expiresAt? }` |
| `ssh.keys` | `GET /job/:job/ssh/keys` | none |
| `ssh.remove` | `DELETE /job/:job/ssh/keys` | `{ sshPublicKey }` |
| `terminal` | WebSocket `{ path: '/terminal', body: { jobAddress, message, signature, op?, cols, rows } }` | stdin and resize frames follow |

Authorization answers HTTP 201 and `{ job, sshUser, authorized: true, expiresAt? }`.
List and replace answer `{ job, sshUser, keys }`, each key `{ sshPublicKey, expiresAt? }`.
Removal answers `{ job, sshUser, revoked: true }`. `sshUser` is always `nosana`. The full node route table is in
`packages/api/src/client/node/schema.ts`.
