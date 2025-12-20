# Nosana Jobs

Projects can post pipeline jobs through the Nosana Jobs program.
It lets nodes in the Nosana Network earn tokens by doing those jobs.

<!-- BEGIN_NOS_DOCS -->

## Program Information

| Info            | Description                                                                                                                         |
|-----------------|-------------------------------------------------------------------------------------------------------------------------------------|
| Type            | [Solana Program](https://docs.solana.com/developing/intro/programs#on-chain-programs)                                               |
| Source Code     | [GitHub](https://github.com/nosana-ci/nosana-programs)                                                                              |
| Build Status    | [Anchor Verified](https://www.apr.dev/program/nosJhNRqr2bc9g1nfGDcXXTXvYUmxD4cVwy2pMWhrYM)                                          |
| Accounts        | [`4`](#accounts)                                                                                                                    |
| Instructions    | [`19`](#instructions)                                                                                                               |
| Types           | [`3`](#types)                                                                                                                       |
| Errors          | [`19`](#errors)                                                                                                                     |
| Domain          | `nosana-jobs.sol`                                                                                                                   |
|  Address        | [`nosJhNRqr2bc9g1nfGDcXXTXvYUmxD4cVwy2pMWhrYM`](https://explorer.solana.com/address/nosJhNRqr2bc9g1nfGDcXXTXvYUmxD4cVwy2pMWhrYM)    |

## Instructions

A number of 19 instruction are defined in the Nosana Jobs program.

To load the program with [Anchor](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
const programId = new PublicKey('nosJhNRqr2bc9g1nfGDcXXTXvYUmxD4cVwy2pMWhrYM');
const idl = await Program.fetchIdl(programId.toString());
const program = new Program(idl, programId);
```

:::tabs

== Open
### Open

Initialize a [MarketAccount](#market-account) and [VaultAccount](#vault-account).

#### Account Info

The following 8 account addresses should be provided when invoking this instruction.

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `mint`                 | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The token Mint address for this instruction.                                                      |
| `market`               | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="#3EAF7C" />       | The [MarketAccount](#market-account) address.                                                     |
| `vault`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [VaultAccount](#vault-account) address.                                                       |
| `authority`            | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="#3EAF7C" />       | The signing authority of the program invocation.                                                  |
| `accessKey`            | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The Node Access Key address.                                                                      |
| `rent`                 | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The official Solana rent address. Responsible for lamports.                                       |
| `systemProgram`        | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The official Solana system program address. Responsible for system CPIs.                          |
| `tokenProgram`         | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The official SPL Token Program address. Responsible for token CPIs.                               |

#### Arguments

The following 5 arguments should also be provided when invoking this instruction.

| Name                   | Type              | Size    | Offset  | Description                                               |
|------------------------|-------------------|---------|---------|-----------------------------------------------------------|
| `jobExpiration`        | `i64`             | `16`    | `0`     | The expiration time in seconds for jobs.                  |
| `jobPrice`             | `u64`             | `8`     | `16`    | The price for jobs in this market.                        |
| `jobTimeout`           | `i64`             | `16`    | `24`    | The timeout time in seconds for jobs.                     |
| `jobType`              | `u8`              | `1`     | `40`    | The [JobType](#job-type) number.                          |
| `nodeXnosMinimum`      | `u128`            | `16`    | `41`    | The amount of [`xNOS`](/programs/staking) a node needs to qualify for a market.|

::: details Solana Dispatch ID

The Solana dispatch ID for the Open Instruction
is **`e4dc9b47c7bd3c2d`**,
which can also be expressed as an 8 byte discriminator:

```json
[228,220,155,71,199,189,60,45]
```

::: details Example with Anchor

To invoke the Open Instruction
with [Anchor TS](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .open(
    jobExpiration,     // type: i64
    jobPrice,          // type: u64
    jobTimeout,        // type: i64
    jobType,           // type: u8
    nodeXnosMinimum,   // type: u128
  )
  .accounts({
    mint,              // 𐄂 writable, 𐄂 signer
    market,            // ✓ writable, ✓ signer
    vault,             // ✓ writable, 𐄂 signer
    authority,         // ✓ writable, ✓ signer
    accessKey,         // 𐄂 writable, 𐄂 signer
    rent,              // 𐄂 writable, 𐄂 signer
    systemProgram,     // 𐄂 writable, 𐄂 signer
    tokenProgram,      // 𐄂 writable, 𐄂 signer
  })
  .signers([marketKey, authorityKey])
  .rpc();
```

== Update
### Update

Update a [MarketAccount](#market-account)'s configurations.

#### Account Info

The following 3 account addresses should be provided when invoking this instruction.

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `market`               | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [MarketAccount](#market-account) address.                                                     |
| `accessKey`            | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The Node Access Key address.                                                                      |
| `authority`            | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="#3EAF7C" />     | The signing authority of the program invocation.                                                  |

#### Arguments

The following 5 arguments should also be provided when invoking this instruction.

| Name                   | Type              | Size    | Offset  | Description                                               |
|------------------------|-------------------|---------|---------|-----------------------------------------------------------|
| `jobExpiration`        | `i64`             | `16`    | `0`     | The expiration time in seconds for jobs.                  |
| `jobPrice`             | `u64`             | `8`     | `16`    | The price for jobs in this market.                        |
| `jobType`              | `u8`              | `1`     | `24`    | The [JobType](#job-type) number.                          |
| `nodeStakeMinimum`     | `u128`            | `16`    | `25`    | The amount of [`xNOS`](/programs/staking) a node needs to qualify for a market.|
| `jobTimeout`           | `i64`             | `16`    | `41`    | The timeout time in seconds for jobs.                     |

::: details Solana Dispatch ID

The Solana dispatch ID for the Update Instruction
is **`dbc858b09e3ffd7f`**,
which can also be expressed as an 8 byte discriminator:

```json
[219,200,88,176,158,63,253,127]
```

::: details Example with Anchor

To invoke the Update Instruction
with [Anchor TS](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .update(
    jobExpiration,     // type: i64
    jobPrice,          // type: u64
    jobType,           // type: u8
    nodeStakeMinimum,  // type: u128
    jobTimeout,        // type: i64
  )
  .accounts({
    market,            // ✓ writable, 𐄂 signer
    accessKey,         // 𐄂 writable, 𐄂 signer
    authority,         // 𐄂 writable, ✓ signer
  })
  .signers([authorityKey])
  .rpc();
```

== Close
### Close

Close a [MarketAccount](#market-account) and the associated [VaultAccount](#vault-account).

#### Account Info

The following 5 account addresses should be provided when invoking this instruction.

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `market`               | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [MarketAccount](#market-account) address.                                                     |
| `vault`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [VaultAccount](#vault-account) address.                                                       |
| `user`                 | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The user token account that will debit/credit the tokens.                                         |
| `authority`            | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="#3EAF7C" />     | The signing authority of the program invocation.                                                  |
| `tokenProgram`         | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The official SPL Token Program address. Responsible for token CPIs.                               |

::: details Solana Dispatch ID

The Solana dispatch ID for the Close Instruction
is **`62a5c9b16c41ce60`**,
which can also be expressed as an 8 byte discriminator:

```json
[98,165,201,177,108,65,206,96]
```

::: details Example with Anchor

To invoke the Close Instruction
with [Anchor TS](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .close()
  .accounts({
    market,            // ✓ writable, 𐄂 signer
    vault,             // ✓ writable, 𐄂 signer
    user,              // ✓ writable, 𐄂 signer
    authority,         // 𐄂 writable, ✓ signer
    tokenProgram,      // 𐄂 writable, 𐄂 signer
  })
  .signers([authorityKey])
  .rpc();
```

== Close Admin
### Close Admin

Close a [MarketAccount](#market-account) and the associated [VaultAccount](#vault-account).

#### Account Info

The following 5 account addresses should be provided when invoking this instruction.

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `market`               | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [MarketAccount](#market-account) address.                                                     |
| `vault`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [VaultAccount](#vault-account) address.                                                       |
| `user`                 | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The user token account that will debit/credit the tokens.                                         |
| `authority`            | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="#3EAF7C" />     | The signing authority of the program invocation.                                                  |
| `tokenProgram`         | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The official SPL Token Program address. Responsible for token CPIs.                               |

::: details Solana Dispatch ID

The Solana dispatch ID for the Close Admin Instruction
is **`cab6b98ed0a191bd`**,
which can also be expressed as an 8 byte discriminator:

```json
[202,182,185,142,208,161,145,189]
```

::: details Example with Anchor

To invoke the Close Admin Instruction
with [Anchor TS](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .closeAdmin()
  .accounts({
    market,            // ✓ writable, 𐄂 signer
    vault,             // ✓ writable, 𐄂 signer
    user,              // ✓ writable, 𐄂 signer
    authority,         // 𐄂 writable, ✓ signer
    tokenProgram,      // 𐄂 writable, 𐄂 signer
  })
  .signers([authorityKey])
  .rpc();
```

== Assign
### Assign

Create a [JobAccount](#job-account) and optional [RunAccount](#run-account) with node assigned.

#### Account Info

The following 13 account addresses should be provided when invoking this instruction.

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `job`                  | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="#3EAF7C" />       | The [JobAccount](#job-account) address.                                                           |
| `market`               | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [MarketAccount](#market-account) address.                                                     |
| `run`                  | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="#3EAF7C" />       | The [RunAccount](#run-account) address.                                                           |
| `node`                 | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The node that runs this job.                                                                      |
| `user`                 | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The user token account that will debit/credit the tokens.                                         |
| `vault`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [VaultAccount](#vault-account) address.                                                       |
| `payer`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="#3EAF7C" />       | The paying identy for the rent.                                                                   |
| `rewardsReflection`    | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The Nosana Rewards Program's [ReflectionAccount](/programs/rewards#reflection-account) address.   |
| `rewardsVault`         | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The Nosana Rewards Program's [VaultAccount](/programs/rewards#vault-account) address.             |
| `authority`            | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="#3EAF7C" />     | The signing authority of the program invocation.                                                  |
| `rewardsProgram`       | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The [Nosana Rewards](/programs/rewards) Program address.                                          |
| `tokenProgram`         | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The official SPL Token Program address. Responsible for token CPIs.                               |
| `systemProgram`        | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The official Solana system program address. Responsible for system CPIs.                          |

#### Arguments

The following 2 arguments should also be provided when invoking this instruction.

| Name                   | Type              | Size    | Offset  | Description                                               |
|------------------------|-------------------|---------|---------|-----------------------------------------------------------|
| `ipfsJob`              | `["u8",32]`       | `32`    | `0`     | The byte array representing the IPFS hash to the job.     |
| `timeout`              | `i64`             | `16`    | `32`    | The timeout time in seconds for a job.                    |

::: details Solana Dispatch ID

The Solana dispatch ID for the Assign Instruction
is **`49427dcb51294087`**,
which can also be expressed as an 8 byte discriminator:

```json
[73,66,125,203,81,41,64,135]
```

::: details Example with Anchor

To invoke the Assign Instruction
with [Anchor TS](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .assign(
    ipfsJob,           // type: ["u8",32]
    timeout,           // type: i64
  )
  .accounts({
    job,               // ✓ writable, ✓ signer
    market,            // ✓ writable, 𐄂 signer
    run,               // ✓ writable, ✓ signer
    node,              // 𐄂 writable, 𐄂 signer
    user,              // ✓ writable, 𐄂 signer
    vault,             // ✓ writable, 𐄂 signer
    payer,             // ✓ writable, ✓ signer
    rewardsReflection, // ✓ writable, 𐄂 signer
    rewardsVault,      // ✓ writable, 𐄂 signer
    authority,         // 𐄂 writable, ✓ signer
    rewardsProgram,    // 𐄂 writable, 𐄂 signer
    tokenProgram,      // 𐄂 writable, 𐄂 signer
    systemProgram,     // 𐄂 writable, 𐄂 signer
  })
  .signers([jobKey, runKey, payerKey, authorityKey])
  .rpc();
```

== List
### List

Create a [JobAccount](#job-account) and optional [RunAccount](#run-account).

#### Account Info

The following 12 account addresses should be provided when invoking this instruction.

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `job`                  | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="#3EAF7C" />       | The [JobAccount](#job-account) address.                                                           |
| `market`               | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [MarketAccount](#market-account) address.                                                     |
| `run`                  | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="#3EAF7C" />       | The [RunAccount](#run-account) address.                                                           |
| `user`                 | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The user token account that will debit/credit the tokens.                                         |
| `vault`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [VaultAccount](#vault-account) address.                                                       |
| `payer`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="#3EAF7C" />       | The paying identy for the rent.                                                                   |
| `rewardsReflection`    | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The Nosana Rewards Program's [ReflectionAccount](/programs/rewards#reflection-account) address.   |
| `rewardsVault`         | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The Nosana Rewards Program's [VaultAccount](/programs/rewards#vault-account) address.             |
| `authority`            | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="#3EAF7C" />     | The signing authority of the program invocation.                                                  |
| `rewardsProgram`       | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The [Nosana Rewards](/programs/rewards) Program address.                                          |
| `tokenProgram`         | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The official SPL Token Program address. Responsible for token CPIs.                               |
| `systemProgram`        | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The official Solana system program address. Responsible for system CPIs.                          |

#### Arguments

The following 2 arguments should also be provided when invoking this instruction.

| Name                   | Type              | Size    | Offset  | Description                                               |
|------------------------|-------------------|---------|---------|-----------------------------------------------------------|
| `ipfsJob`              | `["u8",32]`       | `32`    | `0`     | The byte array representing the IPFS hash to the job.     |
| `timeout`              | `i64`             | `16`    | `32`    | The timeout time in seconds for a job.                    |

::: details Solana Dispatch ID

The Solana dispatch ID for the List Instruction
is **`36aec14311298426`**,
which can also be expressed as an 8 byte discriminator:

```json
[54,174,193,67,17,41,132,38]
```

::: details Example with Anchor

To invoke the List Instruction
with [Anchor TS](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .list(
    ipfsJob,           // type: ["u8",32]
    timeout,           // type: i64
  )
  .accounts({
    job,               // ✓ writable, ✓ signer
    market,            // ✓ writable, 𐄂 signer
    run,               // ✓ writable, ✓ signer
    user,              // ✓ writable, 𐄂 signer
    vault,             // ✓ writable, 𐄂 signer
    payer,             // ✓ writable, ✓ signer
    rewardsReflection, // ✓ writable, 𐄂 signer
    rewardsVault,      // ✓ writable, 𐄂 signer
    authority,         // 𐄂 writable, ✓ signer
    rewardsProgram,    // 𐄂 writable, 𐄂 signer
    tokenProgram,      // 𐄂 writable, 𐄂 signer
    systemProgram,     // 𐄂 writable, 𐄂 signer
  })
  .signers([jobKey, runKey, payerKey, authorityKey])
  .rpc();
```

== Delist
### Delist

Remove a [JobAccount](#job-account) from market job queue.

#### Account Info

The following 7 account addresses should be provided when invoking this instruction.

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `job`                  | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [JobAccount](#job-account) address.                                                           |
| `market`               | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [MarketAccount](#market-account) address.                                                     |
| `deposit`              | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | n/a                                                                                               |
| `payer`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The paying identy for the rent.                                                                   |
| `vault`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [VaultAccount](#vault-account) address.                                                       |
| `tokenProgram`         | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The official SPL Token Program address. Responsible for token CPIs.                               |
| `authority`            | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="#3EAF7C" />       | The signing authority of the program invocation.                                                  |

::: details Solana Dispatch ID

The Solana dispatch ID for the Delist Instruction
is **`3788cd6b6bad041f`**,
which can also be expressed as an 8 byte discriminator:

```json
[55,136,205,107,107,173,4,31]
```

::: details Example with Anchor

To invoke the Delist Instruction
with [Anchor TS](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .delist()
  .accounts({
    job,               // ✓ writable, 𐄂 signer
    market,            // ✓ writable, 𐄂 signer
    deposit,           // ✓ writable, 𐄂 signer
    payer,             // ✓ writable, 𐄂 signer
    vault,             // ✓ writable, 𐄂 signer
    tokenProgram,      // 𐄂 writable, 𐄂 signer
    authority,         // ✓ writable, ✓ signer
  })
  .signers([authorityKey])
  .rpc();
```

== Recover
### Recover

Recover funds from a [JobAccount](#job-account) that has been [quit](#quit).

#### Account Info

The following 7 account addresses should be provided when invoking this instruction.

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `job`                  | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [JobAccount](#job-account) address.                                                           |
| `market`               | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The [MarketAccount](#market-account) address.                                                     |
| `vault`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [VaultAccount](#vault-account) address.                                                       |
| `user`                 | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The user token account that will debit/credit the tokens.                                         |
| `payer`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The paying identy for the rent.                                                                   |
| `authority`            | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="#3EAF7C" />     | The signing authority of the program invocation.                                                  |
| `tokenProgram`         | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The official SPL Token Program address. Responsible for token CPIs.                               |

::: details Solana Dispatch ID

The Solana dispatch ID for the Recover Instruction
is **`6cd8263a6d927411`**,
which can also be expressed as an 8 byte discriminator:

```json
[108,216,38,58,109,146,116,17]
```

::: details Example with Anchor

To invoke the Recover Instruction
with [Anchor TS](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .recover()
  .accounts({
    job,               // ✓ writable, 𐄂 signer
    market,            // 𐄂 writable, 𐄂 signer
    vault,             // ✓ writable, 𐄂 signer
    user,              // ✓ writable, 𐄂 signer
    payer,             // ✓ writable, 𐄂 signer
    authority,         // 𐄂 writable, ✓ signer
    tokenProgram,      // 𐄂 writable, 𐄂 signer
  })
  .signers([authorityKey])
  .rpc();
```

== Extend
### Extend

Extend a job timeout

#### Account Info

The following 9 account addresses should be provided when invoking this instruction.

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `job`                  | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [JobAccount](#job-account) address.                                                           |
| `market`               | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The [MarketAccount](#market-account) address.                                                     |
| `user`                 | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The user token account that will debit/credit the tokens.                                         |
| `vault`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [VaultAccount](#vault-account) address.                                                       |
| `rewardsReflection`    | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The Nosana Rewards Program's [ReflectionAccount](/programs/rewards#reflection-account) address.   |
| `rewardsVault`         | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The Nosana Rewards Program's [VaultAccount](/programs/rewards#vault-account) address.             |
| `authority`            | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="#3EAF7C" />     | The signing authority of the program invocation.                                                  |
| `rewardsProgram`       | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The [Nosana Rewards](/programs/rewards) Program address.                                          |
| `tokenProgram`         | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The official SPL Token Program address. Responsible for token CPIs.                               |

#### Arguments

The following 1 arguments should also be provided when invoking this instruction.

| Name                   | Type              | Size    | Offset  | Description                                               |
|------------------------|-------------------|---------|---------|-----------------------------------------------------------|
| `timeout`              | `i64`             | `16`    | `0`     | The timeout time in seconds for a job.                    |

::: details Solana Dispatch ID

The Solana dispatch ID for the Extend Instruction
is **`e47f0001e39a36a8`**,
which can also be expressed as an 8 byte discriminator:

```json
[228,127,0,1,227,154,54,168]
```

::: details Example with Anchor

To invoke the Extend Instruction
with [Anchor TS](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .extend(
    timeout,           // type: i64
  )
  .accounts({
    job,               // ✓ writable, 𐄂 signer
    market,            // 𐄂 writable, 𐄂 signer
    user,              // ✓ writable, 𐄂 signer
    vault,             // ✓ writable, 𐄂 signer
    rewardsReflection, // ✓ writable, 𐄂 signer
    rewardsVault,      // ✓ writable, 𐄂 signer
    authority,         // 𐄂 writable, ✓ signer
    rewardsProgram,    // 𐄂 writable, 𐄂 signer
    tokenProgram,      // 𐄂 writable, 𐄂 signer
  })
  .signers([authorityKey])
  .rpc();
```

== End
### End

End a running [JobAccount](#job-account) and close [RunAccount](#run-account).

#### Account Info

The following 9 account addresses should be provided when invoking this instruction.

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `job`                  | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [JobAccount](#job-account) address.                                                           |
| `market`               | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The [MarketAccount](#market-account) address.                                                     |
| `run`                  | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [RunAccount](#run-account) address.                                                           |
| `deposit`              | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | n/a                                                                                               |
| `user`                 | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The user token account that will debit/credit the tokens.                                         |
| `vault`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [VaultAccount](#vault-account) address.                                                       |
| `payer`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The paying identy for the rent.                                                                   |
| `authority`            | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="#3EAF7C" />       | The signing authority of the program invocation.                                                  |
| `tokenProgram`         | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The official SPL Token Program address. Responsible for token CPIs.                               |

::: details Solana Dispatch ID

The Solana dispatch ID for the End Instruction
is **`b4a0f9d9c2794610`**,
which can also be expressed as an 8 byte discriminator:

```json
[180,160,249,217,194,121,70,16]
```

::: details Example with Anchor

To invoke the End Instruction
with [Anchor TS](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .end()
  .accounts({
    job,               // ✓ writable, 𐄂 signer
    market,            // 𐄂 writable, 𐄂 signer
    run,               // ✓ writable, 𐄂 signer
    deposit,           // ✓ writable, 𐄂 signer
    user,              // ✓ writable, 𐄂 signer
    vault,             // ✓ writable, 𐄂 signer
    payer,             // ✓ writable, 𐄂 signer
    authority,         // ✓ writable, ✓ signer
    tokenProgram,      // 𐄂 writable, 𐄂 signer
  })
  .signers([authorityKey])
  .rpc();
```

== Work
### Work

Enters the [MarketAccount](#market-account) queue, or create  a [RunAccount](#run-account).

#### Account Info

The following 8 account addresses should be provided when invoking this instruction.

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `run`                  | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="#3EAF7C" />       | The [RunAccount](#run-account) address.                                                           |
| `market`               | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [MarketAccount](#market-account) address.                                                     |
| `payer`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="#3EAF7C" />       | The paying identy for the rent.                                                                   |
| `stake`                | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The [StakeAccount](/programs/staking#stake-account) address.                                      |
| `nft`                  | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The Token Account address that holds the NFT.                                                     |
| `metadata`             | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The Metaplex Metadata address, that belongs to the NFT.                                           |
| `authority`            | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="#3EAF7C" />     | The signing authority of the program invocation.                                                  |
| `systemProgram`        | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The official Solana system program address. Responsible for system CPIs.                          |

::: details Solana Dispatch ID

The Solana dispatch ID for the Work Instruction
is **`0f432dc3d789e52f`**,
which can also be expressed as an 8 byte discriminator:

```json
[15,67,45,195,215,137,229,47]
```

::: details Example with Anchor

To invoke the Work Instruction
with [Anchor TS](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .work()
  .accounts({
    run,               // ✓ writable, ✓ signer
    market,            // ✓ writable, 𐄂 signer
    payer,             // ✓ writable, ✓ signer
    stake,             // 𐄂 writable, 𐄂 signer
    nft,               // 𐄂 writable, 𐄂 signer
    metadata,          // 𐄂 writable, 𐄂 signer
    authority,         // 𐄂 writable, ✓ signer
    systemProgram,     // 𐄂 writable, 𐄂 signer
  })
  .signers([runKey, payerKey, authorityKey])
  .rpc();
```

== Stop
### Stop

Exit the node queue from [MarketAccount](#market-account).

#### Account Info

The following 3 account addresses should be provided when invoking this instruction.

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `market`               | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [MarketAccount](#market-account) address.                                                     |
| `node`                 | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The node that runs this job.                                                                      |
| `authority`            | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="#3EAF7C" />     | The signing authority of the program invocation.                                                  |

::: details Solana Dispatch ID

The Solana dispatch ID for the Stop Instruction
is **`2a85203cabfdb89b`**,
which can also be expressed as an 8 byte discriminator:

```json
[42,133,32,60,171,253,184,155]
```

::: details Example with Anchor

To invoke the Stop Instruction
with [Anchor TS](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .stop()
  .accounts({
    market,            // ✓ writable, 𐄂 signer
    node,              // 𐄂 writable, 𐄂 signer
    authority,         // 𐄂 writable, ✓ signer
  })
  .signers([authorityKey])
  .rpc();
```

== Claim
### Claim

Claim a job that is [stopped](#stop).

#### Account Info

The following 9 account addresses should be provided when invoking this instruction.

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `job`                  | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [JobAccount](#job-account) address.                                                           |
| `run`                  | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="#3EAF7C" />       | The [RunAccount](#run-account) address.                                                           |
| `market`               | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The [MarketAccount](#market-account) address.                                                     |
| `stake`                | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The [StakeAccount](/programs/staking#stake-account) address.                                      |
| `nft`                  | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The Token Account address that holds the NFT.                                                     |
| `metadata`             | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The Metaplex Metadata address, that belongs to the NFT.                                           |
| `payer`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="#3EAF7C" />       | The paying identy for the rent.                                                                   |
| `authority`            | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="#3EAF7C" />     | The signing authority of the program invocation.                                                  |
| `systemProgram`        | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The official Solana system program address. Responsible for system CPIs.                          |

::: details Solana Dispatch ID

The Solana dispatch ID for the Claim Instruction
is **`3ec6d6c1d59f6cd2`**,
which can also be expressed as an 8 byte discriminator:

```json
[62,198,214,193,213,159,108,210]
```

::: details Example with Anchor

To invoke the Claim Instruction
with [Anchor TS](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .claim()
  .accounts({
    job,               // ✓ writable, 𐄂 signer
    run,               // ✓ writable, ✓ signer
    market,            // 𐄂 writable, 𐄂 signer
    stake,             // 𐄂 writable, 𐄂 signer
    nft,               // 𐄂 writable, 𐄂 signer
    metadata,          // 𐄂 writable, 𐄂 signer
    payer,             // ✓ writable, ✓ signer
    authority,         // 𐄂 writable, ✓ signer
    systemProgram,     // 𐄂 writable, 𐄂 signer
  })
  .signers([runKey, payerKey, authorityKey])
  .rpc();
```

== Complete
### Complete

Complete a job that has been [stopped](#stop).

#### Account Info

The following 2 account addresses should be provided when invoking this instruction.

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `job`                  | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [JobAccount](#job-account) address.                                                           |
| `authority`            | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="#3EAF7C" />     | The signing authority of the program invocation.                                                  |

#### Arguments

The following 1 arguments should also be provided when invoking this instruction.

| Name                   | Type              | Size    | Offset  | Description                                               |
|------------------------|-------------------|---------|---------|-----------------------------------------------------------|
| `ipfsResult`           | `["u8",32]`       | `32`    | `0`     | The byte array representing the IPFS hash to the results. |

::: details Solana Dispatch ID

The Solana dispatch ID for the Complete Instruction
is **`004de0938819584c`**,
which can also be expressed as an 8 byte discriminator:

```json
[0,77,224,147,136,25,88,76]
```

::: details Example with Anchor

To invoke the Complete Instruction
with [Anchor TS](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .complete(
    ipfsResult,        // type: ["u8",32]
  )
  .accounts({
    job,               // ✓ writable, 𐄂 signer
    authority,         // 𐄂 writable, ✓ signer
  })
  .signers([authorityKey])
  .rpc();
```

== Finish
### Finish

Post the result for a  [JobAccount](#job-account) to finish it and get paid.

#### Account Info

The following 10 account addresses should be provided when invoking this instruction.

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `job`                  | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [JobAccount](#job-account) address.                                                           |
| `run`                  | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [RunAccount](#run-account) address.                                                           |
| `market`               | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The [MarketAccount](#market-account) address.                                                     |
| `vault`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [VaultAccount](#vault-account) address.                                                       |
| `deposit`              | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | n/a                                                                                               |
| `user`                 | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The user token account that will debit/credit the tokens.                                         |
| `payer`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The paying identy for the rent.                                                                   |
| `project`              | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The project that listed this job.                                                                 |
| `authority`            | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="#3EAF7C" />     | The signing authority of the program invocation.                                                  |
| `tokenProgram`         | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The official SPL Token Program address. Responsible for token CPIs.                               |

#### Arguments

The following 1 arguments should also be provided when invoking this instruction.

| Name                   | Type              | Size    | Offset  | Description                                               |
|------------------------|-------------------|---------|---------|-----------------------------------------------------------|
| `ipfsResult`           | `["u8",32]`       | `32`    | `0`     | The byte array representing the IPFS hash to the results. |

::: details Solana Dispatch ID

The Solana dispatch ID for the Finish Instruction
is **`434aaa847de9b625`**,
which can also be expressed as an 8 byte discriminator:

```json
[67,74,170,132,125,233,182,37]
```

::: details Example with Anchor

To invoke the Finish Instruction
with [Anchor TS](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .finish(
    ipfsResult,        // type: ["u8",32]
  )
  .accounts({
    job,               // ✓ writable, 𐄂 signer
    run,               // ✓ writable, 𐄂 signer
    market,            // 𐄂 writable, 𐄂 signer
    vault,             // ✓ writable, 𐄂 signer
    deposit,           // ✓ writable, 𐄂 signer
    user,              // ✓ writable, 𐄂 signer
    payer,             // ✓ writable, 𐄂 signer
    project,           // ✓ writable, 𐄂 signer
    authority,         // 𐄂 writable, ✓ signer
    tokenProgram,      // 𐄂 writable, 𐄂 signer
  })
  .signers([authorityKey])
  .rpc();
```

== Quit
### Quit

Quit a [JobAccount](#job-account) that you have started.

#### Account Info

The following 4 account addresses should be provided when invoking this instruction.

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `job`                  | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [JobAccount](#job-account) address.                                                           |
| `run`                  | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [RunAccount](#run-account) address.                                                           |
| `payer`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The paying identy for the rent.                                                                   |
| `authority`            | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="#3EAF7C" />     | The signing authority of the program invocation.                                                  |

::: details Solana Dispatch ID

The Solana dispatch ID for the Quit Instruction
is **`bf678df050816799`**,
which can also be expressed as an 8 byte discriminator:

```json
[191,103,141,240,80,129,103,153]
```

::: details Example with Anchor

To invoke the Quit Instruction
with [Anchor TS](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .quit()
  .accounts({
    job,               // ✓ writable, 𐄂 signer
    run,               // ✓ writable, 𐄂 signer
    payer,             // ✓ writable, 𐄂 signer
    authority,         // 𐄂 writable, ✓ signer
  })
  .signers([authorityKey])
  .rpc();
```

== Quit Admin
### Quit Admin

Quit a [JobAccount](#job-account) that you have started.

#### Account Info

The following 3 account addresses should be provided when invoking this instruction.

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `run`                  | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [RunAccount](#run-account) address.                                                           |
| `payer`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The paying identy for the rent.                                                                   |
| `authority`            | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="#3EAF7C" />     | The signing authority of the program invocation.                                                  |

::: details Solana Dispatch ID

The Solana dispatch ID for the Quit Admin Instruction
is **`67ee6e08b61438c4`**,
which can also be expressed as an 8 byte discriminator:

```json
[103,238,110,8,182,20,56,196]
```

::: details Example with Anchor

To invoke the Quit Admin Instruction
with [Anchor TS](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .quitAdmin()
  .accounts({
    run,               // ✓ writable, 𐄂 signer
    payer,             // ✓ writable, 𐄂 signer
    authority,         // 𐄂 writable, ✓ signer
  })
  .signers([authorityKey])
  .rpc();
```

== Clean
### Clean

Close an [JobAccount](#job-account).

#### Account Info

The following 3 account addresses should be provided when invoking this instruction.

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `job`                  | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [JobAccount](#job-account) address.                                                           |
| `market`               | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The [MarketAccount](#market-account) address.                                                     |
| `payer`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The paying identy for the rent.                                                                   |

::: details Solana Dispatch ID

The Solana dispatch ID for the Clean Instruction
is **`fabf388096fb0167`**,
which can also be expressed as an 8 byte discriminator:

```json
[250,191,56,128,150,251,1,103]
```

::: details Example with Anchor

To invoke the Clean Instruction
with [Anchor TS](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .clean()
  .accounts({
    job,               // ✓ writable, 𐄂 signer
    market,            // 𐄂 writable, 𐄂 signer
    payer,             // ✓ writable, 𐄂 signer
  })
  .rpc();
```

== Clean Admin
### Clean Admin

Close an [JobAccount](#job-account) as an admin.

#### Account Info

The following 3 account addresses should be provided when invoking this instruction.

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `job`                  | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [JobAccount](#job-account) address.                                                           |
| `payer`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The paying identy for the rent.                                                                   |
| `authority`            | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="#3EAF7C" />     | The signing authority of the program invocation.                                                  |

::: details Solana Dispatch ID

The Solana dispatch ID for the Clean Admin Instruction
is **`f55abc44fdebab69`**,
which can also be expressed as an 8 byte discriminator:

```json
[245,90,188,68,253,235,171,105]
```

::: details Example with Anchor

To invoke the Clean Admin Instruction
with [Anchor TS](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .cleanAdmin()
  .accounts({
    job,               // ✓ writable, 𐄂 signer
    payer,             // ✓ writable, 𐄂 signer
    authority,         // 𐄂 writable, ✓ signer
  })
  .signers([authorityKey])
  .rpc();
```

:::
## Accounts

A number of 4 accounts make up for the Nosana Jobs Program's state.

:::tabs

== Market Account
### Market Account

The `MarketAccount` struct holds all the information about jobs and the nodes queue.
The total size of this account is `10,211` bytes.

| Name                        | Type                        | Size    | Offset  | Description                                                                                       |
|-----------------------------|-----------------------------|---------|---------|---------------------------------------------------------------------------------------------------|
| `authority`                 | `publicKey`                 | `32`    | `8`     | The signing authority of the program invocation.                                                  |
| `jobExpiration`             | `i64`                       | `16`    | `40`    | The expiration time in seconds for jobs.                                                          |
| `jobPrice`                  | `u64`                       | `8`     | `56`    | The price for jobs in this market.                                                                |
| `jobTimeout`                | `i64`                       | `16`    | `64`    | The timeout time in seconds for jobs.                                                             |
| `jobType`                   | `u8`                        | `1`     | `80`    | The [JobType](#job-type) number.                                                                  |
| `vault`                     | `publicKey`                 | `32`    | `81`    | The [VaultAccount](#vault-account) address.                                                       |
| `vaultBump`                 | `u8`                        | `1`     | `113`   | The bump for the [VaultAccount](#vault-account).                                                  |
| `nodeAccessKey`             | `publicKey`                 | `32`    | `114`   | The NFT collection address of an NFT that the node holds, in order to access this market.         |
| `nodeXnosMinimum`           | `u128`                      | `16`    | `146`   | The amount of [`xNOS`](/programs/staking) a node needs to qualify for a market.                   |
| `queueType`                 | `u8`                        | `1`     | `162`   | The [QueueType](#queue-type) of the queue. Either Nodes or Jobs.                                  |
| `queue`                     | `Vec<publicKey>`            | `10048` | `163`   | The queue of order in the market.                                                                 |

::: details Anchor Account Discriminator

The first 8 bytes, also known as Anchor's 8 byte discriminator, for the Market Account
are **`c94ebbe1f0c6c9fb`**, which can also be expressed in byte array:

```json
[201,78,187,225,240,198,201,251]
```

== Job Account
### Job Account

The `JobAccount` struct holds all the information about any individual jobs.
The total size of this account is `257` bytes.

| Name                        | Type                        | Size    | Offset  | Description                                                                                       |
|-----------------------------|-----------------------------|---------|---------|---------------------------------------------------------------------------------------------------|
| `ipfsJob`                   | `["u8",32]`                 | `32`    | `8`     | The byte array representing the IPFS hash to the job.                                             |
| `ipfsResult`                | `["u8",32]`                 | `32`    | `40`    | The byte array representing the IPFS hash to the results.                                         |
| `market`                    | `publicKey`                 | `32`    | `72`    | The [MarketAccount](#market-account) address.                                                     |
| `node`                      | `publicKey`                 | `32`    | `104`   | The node that runs this job.                                                                      |
| `payer`                     | `publicKey`                 | `32`    | `136`   | The paying identy for the rent.                                                                   |
| `price`                     | `u64`                       | `8`     | `168`   | The price in [$NOS](/tokens/token).                                                               |
| `project`                   | `publicKey`                 | `32`    | `176`   | The project that listed this job.                                                                 |
| `state`                     | `u8`                        | `1`     | `208`   | n/a                                                                                               |
| `timeEnd`                   | `i64`                       | `16`    | `209`   | The unix time this job has finished running.                                                      |
| `timeStart`                 | `i64`                       | `16`    | `225`   | The unix time this job has started running.                                                       |
| `timeout`                   | `i64`                       | `16`    | `241`   | The timeout time in seconds for a job.                                                            |

::: details Anchor Account Discriminator

The first 8 bytes, also known as Anchor's 8 byte discriminator, for the Job Account
are **`5b10a2052dd27d41`**, which can also be expressed in byte array:

```json
[91,16,162,5,45,210,125,65]
```

== Run Account
### Run Account

The `RunAccount` struct holds temporary information that matches nodes to jobs.
The total size of this account is `121` bytes.

| Name                        | Type                        | Size    | Offset  | Description                                                                                       |
|-----------------------------|-----------------------------|---------|---------|---------------------------------------------------------------------------------------------------|
| `job`                       | `publicKey`                 | `32`    | `8`     | The [JobAccount](#job-account) address.                                                           |
| `node`                      | `publicKey`                 | `32`    | `40`    | The node that runs this job.                                                                      |
| `payer`                     | `publicKey`                 | `32`    | `72`    | The paying identy for the rent.                                                                   |
| `state`                     | `u8`                        | `1`     | `104`   | n/a                                                                                               |
| `time`                      | `i64`                       | `16`    | `105`   | n/a                                                                                               |

::: details Anchor Account Discriminator

The first 8 bytes, also known as Anchor's 8 byte discriminator, for the Run Account
are **`c2a96ee6eb0be116`**, which can also be expressed in byte array:

```json
[194,169,110,230,235,11,225,22]
```

== Vault Account
### Vault Account

The `VaultAccount` is a regular Solana Token Account.

:::

## Types

A number of 3 type variants are defined in the Nosana Jobs Program's state.

::: tabs

== Queue Type
### Queue Type

The `QueueType` describes the type of queue

A number of 3 variants are defined in this `enum`:
| Name                                  | Number                                |
|---------------------------------------|---------------------------------------|
| `Job`                                 | `0`                                   |
| `Node`                                | `1`                                   |
| `Empty`                               | `2`                                   |

== Job State
### Job State

The `JobState` describes the status of a job.

A number of 3 variants are defined in this `enum`:
| Name                                  | Number                                |
|---------------------------------------|---------------------------------------|
| `Queued`                              | `0`                                   |
| `Done`                                | `1`                                   |
| `Stopped`                             | `2`                                   |

== Job Type
### Job Type

The `JobType` describes the type of any job.

A number of 6 variants are defined in this `enum`:
| Name                                  | Number                                |
|---------------------------------------|---------------------------------------|
| `Default`                             | `0`                                   |
| `Small`                               | `1`                                   |
| `Medium`                              | `2`                                   |
| `Large`                               | `3`                                   |
| `Gpu`                                 | `4`                                   |
| `Unknown`                             | `255`                                 |

## Errors

A number of 19 errors are defined in the Nosana Jobs Program.

:::tabs

== 6000

::: warning Nosana Error

### `6000` - Invalid Market Account

This market account is not valid.

== 6001

::: warning Nosana Error

### `6001` - Market In Wrong State

This market does not have the right status.

== 6002

::: warning Nosana Error

### `6002` - Not In Market Queue

Account cannot be find account in market queue.

== 6003

::: warning Nosana Error

### `6003` - Invalid Job Account

This job account is not valid.

== 6004

::: warning Nosana Error

### `6004` - Job In Wrong State

This job does not have the right status.

== 6005

::: warning Nosana Error

### `6005` - Job Not Expired

The job has not yet expired.

== 6006

::: warning Nosana Error

### `6006` - Job Result Null

The job result can not be null.

== 6007

::: warning Nosana Error

### `6007` - Job Invalid Project

The job has a different project owner.

== 6008

::: warning Nosana Error

### `6008` - Job Timeout Not Greater

The new job timeout should be larger than the current one.

== 6009

::: warning Nosana Error

### `6009` - Job Invalid Run Account

The run account does not match the job.

== 6010

::: warning Nosana Error

### `6010` - Job Results Already Set

The job results are already set.

== 6011

::: warning Nosana Error

### `6011` - Node Queue Does Not Match

This node queue does not match.

== 6012

::: warning Nosana Error

### `6012` - Node Stake Unauthorized

This node is not authorizing this stake.

== 6013

::: warning Nosana Error

### `6013` - Node Not Enough Stake

This node has not staked enough tokens.

== 6014

::: warning Nosana Error

### `6014` - Node Already Queued

This node is already present in the queue.

== 6015

::: warning Nosana Error

### `6015` - Node Nft Wrong Metadata

This metadata does not have the correct address.

== 6016

::: warning Nosana Error

### `6016` - Node Nft Wrong Owner

This NFT is not owned by this node.

== 6017

::: warning Nosana Error

### `6017` - Node Nft Invalid Amount

Access NFT amount cannot be 0.

== 6018

::: warning Nosana Error

### `6018` - Node Key Invalid Collection

This access key does not belong to a verified collection.

:::

## Diagram

### Instruction Diagram

```mermaid
flowchart TB

    project -->| extend  | job
    project ---| list    | market -->| list   | job
                           market -->| list   | run
    project ---| delist  | market -->| delist | job
    project -->| recover | job
    project ---| end     | run    -->| end    | job
    project -.- nos1 -.-> vault
    vault   -.- nos2 -.-> node
    project -.- nos3 -.-> fee

    node -->| stop   | market
    node ---| work   | market -->| work   | run
    node ---| claim  | run    -->| claim  | job
    node ---| finish | run    -->| finish | job
    node ---| quit   | run    -->| quit   | job

    admin -->| open   | market
    admin -->| close  | market
    admin -->| update | market

    all -->| clean | job

    all(Everybody)
    node(Worker Node)
    project(Software Project)
    admin(Administrator)
    fee(Network Fees)
    nos1[NOS]
    nos2[NOS]
    nos3[NOS]
    market{Market Account}
    job{Job Account}
    run{Run Account}
    vault{Vault Account}

    classDef orange fill:#f96,stroke:#333,stroke-width:3px;
    classDef yellow fill:#ff7,stroke:#333,stroke-width:2px;

    class market,job,vault,run orange
    class nos1,nos2,nos3 yellow
```

### Queue Diagrams

Below a representation of the functioning for the different [QueueTypes](#queue-type).

::: tabs

== Node Queue
#### Node

When there a more nodes than jobs in a given Market, the queue will fill up with nodes.
The [`QueueType`](#queue-type) will be `Node` in this case.

```mermaid
flowchart TB
    subgraph Market
        market
        node
        project
        subgraph Queue
            order1 --> order2 --> order3
        end
    end

    node --> Queue
    order3 --> run
    project --> run

    node(Worker Node)
    project(Software Project)
    order1{Node}
    order2{Node}
    order3{Node}
    run{Run Account}
    market[Job Price<br>Job Timeout<br>Job Type<br>Job Expiration<br>Node Access Key<br>Node Minimum Stake]

    classDef orange fill:#f96,stroke:#333,stroke-width:3px;
    classDef yellow fill:#ff7,stroke:#333,stroke-width:2px;
    classDef grey fill:#BFC9CA,stroke:#333,stroke-width:2px;

    class order1,order2,order3 orange;
    class run yellow;
    class market grey;
```

== Job Queue
#### Job Queue

Vise versa, When there a more jobs than nodes in a given Market, the queue will fill up with jobs.
The [`QueueType`](#queue-type) will be `Job` in this case.

```mermaid
flowchart TB
    subgraph Market
        market
        node
        project
        subgraph Queue
            order1 --> order2 --> order3
        end
    end

    vault
    project -->|list| Queue
    project -->|list| vault
    order3 --> run
    node --> run

    node(Worker Node)
    project(Software Project)
    order1{Job}
    order2{Job}
    order3{Job}
    vault{Vault}
    run{Run Account}
    market[Job Price<br>Job Timeout<br>Job Type<br>Job Expiration<br>Node Access Key<br>Node Minimum Stake]

    classDef blue fill:#0083B1,stroke:#333,stroke-width:3px;
    classDef yellow fill:#ff7,stroke:#333,stroke-width:2px;
    classDef grey fill:#BFC9CA,stroke:#333,stroke-width:2px;
    class order1,order2,order3 blue;
    class run,vault yellow;
    class market grey;
```

== Empty Queue
#### Empty Queue

Finally, at the point when the market is satisfied, the queue will be empty.
The [`QueueType`](#queue-type) will be `Unknown` in this case.

```mermaid
flowchart TB
    subgraph Market
        node
        project
        market
        subgraph Queue
            order
        end
    end

    node --> Queue
    project --> Queue

    node(Worker Node)
    project(Software Project)
    order{Order}
    market[Job Price<br>Job Timeout<br>Job Type<br>Job Expiration<br>Node Access Key<br>Node Minimum Stake]

    classDef purple fill:#FC33FF,stroke:#333,stroke-width:3px;
    classDef grey fill:#BFC9CA,stroke:#333,stroke-width:2px;
    class order purple;
    class market grey;
```

<!-- END_NOS_DOCS -->
