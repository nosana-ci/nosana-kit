# SSH access

Use `client.ssh` for node requests. The service sends the standard Nosana
authorization header and validates the node's response. It supports a wallet
configured on the client or an `authorizationProvider` for deployment wallets.

```ts
const job = { job: jobId, node: nodeId, nodeDomain: 'node.k8s.dev.nos.ci' };

// Deployment-level access: omit expiresAt.
await client.ssh.authorizeKey({ ...job, sshPublicKey });

// Temporary access: Date becomes an ISO UTC timestamp in the JSON body.
await client.ssh.authorizeKey({
  ...job, sshPublicKey, expiresAt: new Date(Date.now() + 60_000),
});

// CLI convenience API: four minutes by default, with a positive ttlMs override.
await client.ssh.authorizeEphemeralKey({ ...job, publicKey: sshPublicKey });

const { keys } = await client.ssh.listKeys(job);
await client.ssh.replaceKeys({ ...job, publicKeys: [sshPublicKey] });
await client.ssh.replaceKeys({ ...job, publicKeys: [] });
await client.ssh.revokeKey({ ...job, sshPublicKey });
```

`replaceKeys` replaces permanent keys and keeps unrelated temporary CLI grants.
`revokeKey` removes that specific key regardless of expiry. Key identity is its
algorithm and key material; changing a comment does not create separate access.
At most 10 active keys and 64 KiB of public key data are allowed per job.
Revocation and expiry prevent new SSH connections. Existing sessions remain open
until disconnected or the job ends.

## Deployment manager integration

Deployment-level keys are managed on the deployment object under `deployment.ssh`.
They are stored on the deployment (no new revision or restart) and injected into
every job posted from then on. `add` and `remove` accept one key or a list, and
identify a key by its type and material, so a differing comment neither adds a
duplicate nor misses a removal:

```ts
const keys = await deployment.ssh.keys();
const result = await deployment.ssh.add(publicKey);
await deployment.ssh.remove(publicKey);
// Saving can succeed while node updates fail. Inspect result.jobs.
```

For DM's server implementation, replace each running job's permanent key set
with `client.ssh.replaceKeys`, including when the new set is empty. Use the
deployment wallet to sign, or supply a provider that returns a raw 64-byte
signature or the standard `message:base58-signature` string:

```ts
await client.ssh.replaceKeys({
  ...job,
  publicKeys,
  authorizationProvider: (message) => deployment.generateAuthHeader({
    message, includeTime: 'false',
  }),
});
```

The provider must sign the exact message supplied by Kit. When working inside DM,
use its deployment-wallet signer directly rather than calling its own HTTP API.
Preserve per-job failures; retry failed nodes. A failure to apply keys must not
be presented as completed revocation. Keep deployment revision/key storage in DM;
these Kit methods handle the node requests.

The devnet DM schema checked on 2026-08-30 still describes additions only for
running jobs. DM must adopt `replaceKeys` before dashboard removal can revoke
keys on those jobs. The dashboard should continue using the deployment API,
not independently issue competing node updates.

## Node wire contract

All requests use HTTPS and `Authorization: message:base58-signature` generated
by `@nosana/authorization.generateHeaders`. The node uses the matching
`validateHeaders` and checks the active job owner. Headers are credentials:
do not log them or forward them through redirects. They do not bind the body.

| Operation | Method and path | Body |
| --- | --- | --- |
| `authorizeKey` | `POST /job/:jobId/ssh/authorize` | `{ sshPublicKey, expiresAt? }` |
| `listKeys` | `GET /job/:jobId/ssh/keys` | none |
| `replaceKeys` | `PUT /job/:jobId/ssh/keys` | `{ publicKeys }` |
| `revokeKey` | `DELETE /job/:jobId/ssh/keys` | `{ sshPublicKey }` |

Authorization returns HTTP 201 and `{ authorized: true, job, sshUser, expiresAt? }`.
List and replace return HTTP 200 and `{ job, sshUser, keys }`, where each key is
`{ sshPublicKey, expiresAt? }`. Revoke returns HTTP 200 and
`{ revoked: true, job, sshUser }`. Permanent keys omit `expiresAt` in both directions;
`null` is invalid. Temporary keys need a future date and have no five-minute cap.

List returns the node's persisted desired state. A failed gateway write can leave
application pending until a retry or restoration; an HTTP failure is not success.
HTTP failures throw `SshRequestError` with a `status` field. Malformed success
responses also throw. All methods accept an `AbortSignal` via `signal`.

## Migration

Rebuild/restart the node after installing its new `@nosana/authorization`
dependency. Update Kit consumers together with the node: old clients posting
`{ message, signature }` are no longer supported by this endpoint. The old
`buildSshAuthorizationMessage` and SSH-specific message constants were removed.
The web-terminal signed-grant protocol and its five-minute cap are unchanged.
