# Nosana Staking

The staking program allows users to stake `NOS` tokens for a variable amount of time.

The staking dashboard can be found here: https://dashboard.nosana.com/stake/

There are 2 values associated with a users stake:

- Staked NOS
- xNOS (Staked NOS x duration)

The staked NOS is the amount of tokens that the vault actually holds for the user that can be slashed or unstaked,
while xNOS is a value indicating a users rank for purposes like giveaways and voting.

<!-- BEGIN_NOS_DOCS -->

## Program Information

| Info            | Description                                                                                                                         |
|-----------------|-------------------------------------------------------------------------------------------------------------------------------------|
| Type            | [Solana Program](https://docs.solana.com/developing/intro/programs#on-chain-programs)                                               |
| Source Code     | [GitHub](https://github.com/nosana-ci/nosana-programs)                                                                              |
| Build Status    | [Anchor Verified](https://www.apr.dev/program/nosScmHY2uR24Zh751PmGj9ww9QRNHewh9H59AfrTJE)                                          |
| Accounts        | [`3`](#accounts)                                                                                                                    |
| Instructions    | [`10`](#instructions)                                                                                                               |
| Types           | [`0`](#types)                                                                                                                       |
| Errors          | [`13`](#errors)                                                                                                                     |
| Domain          | `nosana-staking.sol`                                                                                                                |
|  Address        | [`nosScmHY2uR24Zh751PmGj9ww9QRNHewh9H59AfrTJE`](https://explorer.solana.com/address/nosScmHY2uR24Zh751PmGj9ww9QRNHewh9H59AfrTJE)    |

## Instructions

A number of 10 instruction are defined in the Nosana Staking program.

To load the program with [Anchor](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
const programId = new PublicKey('nosScmHY2uR24Zh751PmGj9ww9QRNHewh9H59AfrTJE');
const idl = await Program.fetchIdl(programId.toString());
const program = new Program(idl, programId);
```

:::tabs

== Init
### Init

Initialize the [SettingsAccount](#settings-account).

#### Account Info

The following 4 account addresses should be provided when invoking this instruction.

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `settings`             | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [SettingsAccount](#settings-account) address.                                                 |
| `authority`            | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="#3EAF7C" />       | The signing authority of the program invocation.                                                  |
| `systemProgram`        | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The official Solana system program address. Responsible for system CPIs.                          |
| `rent`                 | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The official Solana rent address. Responsible for lamports.                                       |

::: details Solana Dispatch ID

The Solana dispatch ID for the Init Instruction
is **`dc3bcfec6cfa2f64`**,
which can also be expressed as an 8 byte discriminator:

```json
[220,59,207,236,108,250,47,100]
```

::: details Example with Anchor

To invoke the Init Instruction
with [Anchor TS](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .init()
  .accounts({
    settings,          // ✓ writable, 𐄂 signer
    authority,         // ✓ writable, ✓ signer
    systemProgram,     // 𐄂 writable, 𐄂 signer
    rent,              // 𐄂 writable, 𐄂 signer
  })
  .signers([authorityKey])
  .rpc();
```

== Stake
### Stake

Create a [StakeAccount](#stake-account) and [VaultAccount](#vault-account).
Stake `amount` of [NOS](/tokens/token) tokens for `duration` fo seconds.

#### Account Info

The following 8 account addresses should be provided when invoking this instruction.

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `mint`                 | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The token Mint address for this instruction.                                                      |
| `user`                 | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The user token account that will debit/credit the tokens.                                         |
| `vault`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [VaultAccount](#vault-account) address.                                                       |
| `stake`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [StakeAccount](/programs/staking#stake-account) address.                                      |
| `authority`            | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="#3EAF7C" />       | The signing authority of the program invocation.                                                  |
| `systemProgram`        | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The official Solana system program address. Responsible for system CPIs.                          |
| `tokenProgram`         | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The official SPL Token Program address. Responsible for token CPIs.                               |
| `rent`                 | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The official Solana rent address. Responsible for lamports.                                       |

#### Arguments

The following 2 arguments should also be provided when invoking this instruction.

| Name                   | Type              | Size    | Offset  | Description                                               |
|------------------------|-------------------|---------|---------|-----------------------------------------------------------|
| `amount`               | `u64`             | `8`     | `0`     | The number of tokens.                                     |
| `duration`             | `u128`            | `16`    | `8`     | The duration of the stake.                                |

::: details Solana Dispatch ID

The Solana dispatch ID for the Stake Instruction
is **`ceb0ca12c8d1b36c`**,
which can also be expressed as an 8 byte discriminator:

```json
[206,176,202,18,200,209,179,108]
```

::: details Example with Anchor

To invoke the Stake Instruction
with [Anchor TS](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .stake(
    amount,            // type: u64
    duration,          // type: u128
  )
  .accounts({
    mint,              // 𐄂 writable, 𐄂 signer
    user,              // ✓ writable, 𐄂 signer
    vault,             // ✓ writable, 𐄂 signer
    stake,             // ✓ writable, 𐄂 signer
    authority,         // ✓ writable, ✓ signer
    systemProgram,     // 𐄂 writable, 𐄂 signer
    tokenProgram,      // 𐄂 writable, 𐄂 signer
    rent,              // 𐄂 writable, 𐄂 signer
  })
  .signers([authorityKey])
  .rpc();
```

== Unstake
### Unstake

Start the unstake duration.

#### Account Info

The following 3 account addresses should be provided when invoking this instruction.

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `stake`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [StakeAccount](/programs/staking#stake-account) address.                                      |
| `reward`               | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The [RewardAccount](#reward-account) address.                                                     |
| `authority`            | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="#3EAF7C" />     | The signing authority of the program invocation.                                                  |

::: details Solana Dispatch ID

The Solana dispatch ID for the Unstake Instruction
is **`5a5f6b2acd7c32e1`**,
which can also be expressed as an 8 byte discriminator:

```json
[90,95,107,42,205,124,50,225]
```

::: details Example with Anchor

To invoke the Unstake Instruction
with [Anchor TS](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .unstake()
  .accounts({
    stake,             // ✓ writable, 𐄂 signer
    reward,            // 𐄂 writable, 𐄂 signer
    authority,         // 𐄂 writable, ✓ signer
  })
  .signers([authorityKey])
  .rpc();
```

== Restake
### Restake

Make a stake active again and reset the unstake time.

#### Account Info

The following 3 account addresses should be provided when invoking this instruction.

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `vault`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [VaultAccount](#vault-account) address.                                                       |
| `stake`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [StakeAccount](/programs/staking#stake-account) address.                                      |
| `authority`            | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="#3EAF7C" />     | The signing authority of the program invocation.                                                  |

::: details Solana Dispatch ID

The Solana dispatch ID for the Restake Instruction
is **`61a1f1a70620d535`**,
which can also be expressed as an 8 byte discriminator:

```json
[97,161,241,167,6,32,213,53]
```

::: details Example with Anchor

To invoke the Restake Instruction
with [Anchor TS](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .restake()
  .accounts({
    vault,             // ✓ writable, 𐄂 signer
    stake,             // ✓ writable, 𐄂 signer
    authority,         // 𐄂 writable, ✓ signer
  })
  .signers([authorityKey])
  .rpc();
```

== Topup
### Topup

Top-up `amount` of [NOS](/tokens/token) of a [StakeAccount](#stake-account).

#### Account Info

The following 5 account addresses should be provided when invoking this instruction.

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `user`                 | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The user token account that will debit/credit the tokens.                                         |
| `vault`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [VaultAccount](#vault-account) address.                                                       |
| `stake`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [StakeAccount](/programs/staking#stake-account) address.                                      |
| `authority`            | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="#3EAF7C" />     | The signing authority of the program invocation.                                                  |
| `tokenProgram`         | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The official SPL Token Program address. Responsible for token CPIs.                               |

#### Arguments

The following 1 arguments should also be provided when invoking this instruction.

| Name                   | Type              | Size    | Offset  | Description                                               |
|------------------------|-------------------|---------|---------|-----------------------------------------------------------|
| `amount`               | `u64`             | `8`     | `0`     | The number of tokens.                                     |

::: details Solana Dispatch ID

The Solana dispatch ID for the Topup Instruction
is **`7e2a314ee197634d`**,
which can also be expressed as an 8 byte discriminator:

```json
[126,42,49,78,225,151,99,77]
```

::: details Example with Anchor

To invoke the Topup Instruction
with [Anchor TS](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .topup(
    amount,            // type: u64
  )
  .accounts({
    user,              // ✓ writable, 𐄂 signer
    vault,             // ✓ writable, 𐄂 signer
    stake,             // ✓ writable, 𐄂 signer
    authority,         // 𐄂 writable, ✓ signer
    tokenProgram,      // 𐄂 writable, 𐄂 signer
  })
  .signers([authorityKey])
  .rpc();
```

== Extend
### Extend

Extend the `duration` of a [StakeAccount](#stake-account).

#### Account Info

The following 2 account addresses should be provided when invoking this instruction.

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `stake`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [StakeAccount](/programs/staking#stake-account) address.                                      |
| `authority`            | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="#3EAF7C" />     | The signing authority of the program invocation.                                                  |

#### Arguments

The following 1 arguments should also be provided when invoking this instruction.

| Name                   | Type              | Size    | Offset  | Description                                               |
|------------------------|-------------------|---------|---------|-----------------------------------------------------------|
| `duration`             | `u64`             | `8`     | `0`     | The duration of the stake.                                |

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
    duration,          // type: u64
  )
  .accounts({
    stake,             // ✓ writable, 𐄂 signer
    authority,         // 𐄂 writable, ✓ signer
  })
  .signers([authorityKey])
  .rpc();
```

== Close
### Close

Close a [StakeAccount](#stake-account) and [VaultAccount](#vault-account).

#### Account Info

The following 5 account addresses should be provided when invoking this instruction.

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `user`                 | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The user token account that will debit/credit the tokens.                                         |
| `stake`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [StakeAccount](/programs/staking#stake-account) address.                                      |
| `vault`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [VaultAccount](#vault-account) address.                                                       |
| `authority`            | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="#3EAF7C" />       | The signing authority of the program invocation.                                                  |
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
    user,              // ✓ writable, 𐄂 signer
    stake,             // ✓ writable, 𐄂 signer
    vault,             // ✓ writable, 𐄂 signer
    authority,         // ✓ writable, ✓ signer
    tokenProgram,      // 𐄂 writable, 𐄂 signer
  })
  .signers([authorityKey])
  .rpc();
```

== Withdraw
### Withdraw

Withdraw  [NOS](/tokens/token) that is released after an [unstake](#unstake)

#### Account Info

The following 5 account addresses should be provided when invoking this instruction.

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `user`                 | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The user token account that will debit/credit the tokens.                                         |
| `vault`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [VaultAccount](#vault-account) address.                                                       |
| `stake`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [StakeAccount](/programs/staking#stake-account) address.                                      |
| `authority`            | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="#3EAF7C" />       | The signing authority of the program invocation.                                                  |
| `tokenProgram`         | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The official SPL Token Program address. Responsible for token CPIs.                               |

::: details Solana Dispatch ID

The Solana dispatch ID for the Withdraw Instruction
is **`b712469c946da122`**,
which can also be expressed as an 8 byte discriminator:

```json
[183,18,70,156,148,109,161,34]
```

::: details Example with Anchor

To invoke the Withdraw Instruction
with [Anchor TS](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .withdraw()
  .accounts({
    user,              // ✓ writable, 𐄂 signer
    vault,             // ✓ writable, 𐄂 signer
    stake,             // ✓ writable, 𐄂 signer
    authority,         // ✓ writable, ✓ signer
    tokenProgram,      // 𐄂 writable, 𐄂 signer
  })
  .signers([authorityKey])
  .rpc();
```

== Slash
### Slash

Reduce a [StakeAccount](#stake-account)'s [NOS](/tokens/token) tokens.
Slashing is a feature used by the Nosana Protocol to punish bad actors.

#### Account Info

The following 6 account addresses should be provided when invoking this instruction.

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `vault`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [VaultAccount](#vault-account) address.                                                       |
| `stake`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [StakeAccount](/programs/staking#stake-account) address.                                      |
| `tokenAccount`         | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The token account where slash deposits will go.                                                   |
| `settings`             | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The [SettingsAccount](#settings-account) address.                                                 |
| `authority`            | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="#3EAF7C" />     | The signing authority of the program invocation.                                                  |
| `tokenProgram`         | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The official SPL Token Program address. Responsible for token CPIs.                               |

#### Arguments

The following 1 arguments should also be provided when invoking this instruction.

| Name                   | Type              | Size    | Offset  | Description                                               |
|------------------------|-------------------|---------|---------|-----------------------------------------------------------|
| `amount`               | `u64`             | `8`     | `0`     | The number of tokens.                                     |

::: details Solana Dispatch ID

The Solana dispatch ID for the Slash Instruction
is **`cc8d12a108b15c8e`**,
which can also be expressed as an 8 byte discriminator:

```json
[204,141,18,161,8,177,92,142]
```

::: details Example with Anchor

To invoke the Slash Instruction
with [Anchor TS](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .slash(
    amount,            // type: u64
  )
  .accounts({
    vault,             // ✓ writable, 𐄂 signer
    stake,             // ✓ writable, 𐄂 signer
    tokenAccount,      // ✓ writable, 𐄂 signer
    settings,          // 𐄂 writable, 𐄂 signer
    authority,         // 𐄂 writable, ✓ signer
    tokenProgram,      // 𐄂 writable, 𐄂 signer
  })
  .signers([authorityKey])
  .rpc();
```

== Update Settings
### Update Settings

Update the Slashing Authority and Token Account.

#### Account Info

The following 4 account addresses should be provided when invoking this instruction.

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `newAuthority`         | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The new authority of the  [SettingsAccount](#settings-account).                                   |
| `tokenAccount`         | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The token account where slash deposits will go.                                                   |
| `settings`             | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [SettingsAccount](#settings-account) address.                                                 |
| `authority`            | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="#3EAF7C" />     | The signing authority of the program invocation.                                                  |

::: details Solana Dispatch ID

The Solana dispatch ID for the Update Settings Instruction
is **`51a633d59e549d6c`**,
which can also be expressed as an 8 byte discriminator:

```json
[81,166,51,213,158,84,157,108]
```

::: details Example with Anchor

To invoke the Update Settings Instruction
with [Anchor TS](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .updateSettings()
  .accounts({
    newAuthority,      // 𐄂 writable, 𐄂 signer
    tokenAccount,      // 𐄂 writable, 𐄂 signer
    settings,          // ✓ writable, 𐄂 signer
    authority,         // 𐄂 writable, ✓ signer
  })
  .signers([authorityKey])
  .rpc();
```

:::
## Accounts

A number of 3 accounts make up for the Nosana Staking Program's state.

:::tabs

== Settings Account
### Settings Account

The `SettingsAccount` struct holds the information about the
slashing authority and token account.
The total size of this account is `72` bytes.

| Name                        | Type                        | Size    | Offset  | Description                                                                                       |
|-----------------------------|-----------------------------|---------|---------|---------------------------------------------------------------------------------------------------|
| `authority`                 | `publicKey`                 | `32`    | `8`     | The signing authority of the program invocation.                                                  |
| `tokenAccount`              | `publicKey`                 | `32`    | `40`    | The token account where slash deposits will go.                                                   |

::: details Anchor Account Discriminator

The first 8 bytes, also known as Anchor's 8 byte discriminator, for the Settings Account
are **`3f59cb9b4ced733a`**, which can also be expressed in byte array:

```json
[63,89,203,155,76,237,115,58]
```

== Stake Account
### Stake Account

The `StakeAccount` struct holds all the information for any given stake.
The total size of this account is `121` bytes.

| Name                        | Type                        | Size    | Offset  | Description                                                                                       |
|-----------------------------|-----------------------------|---------|---------|---------------------------------------------------------------------------------------------------|
| `amount`                    | `u64`                       | `8`     | `8`     | The number of tokens.                                                                             |
| `authority`                 | `publicKey`                 | `32`    | `16`    | The signing authority of the program invocation.                                                  |
| `duration`                  | `u64`                       | `8`     | `48`    | The duration of the stake.                                                                        |
| `timeUnstake`               | `i64`                       | `16`    | `56`    | n/a                                                                                               |
| `vault`                     | `publicKey`                 | `32`    | `72`    | The [VaultAccount](#vault-account) address.                                                       |
| `vaultBump`                 | `u8`                        | `1`     | `104`   | The bump for the [VaultAccount](#vault-account).                                                  |
| `xnos`                      | `u128`                      | `16`    | `105`   | n/a                                                                                               |

::: details Anchor Account Discriminator

The first 8 bytes, also known as Anchor's 8 byte discriminator, for the Stake Account
are **`509e437c32bdc0ff`**, which can also be expressed in byte array:

```json
[80,158,67,124,50,189,192,255]
```

== Vault Account
### Vault Account

The `VaultAccount` is a regular Solana Token Account.

:::

## Errors

A number of 13 errors are defined in the Nosana Staking Program.

:::tabs

== 6000

::: warning Nosana Error

### `6000` - Amount Not Enough

This amount is not enough.

== 6001

::: warning Nosana Error

### `6001` - Already Initialized

This stake is already running.

== 6002

::: warning Nosana Error

### `6002` - Already Claimed

This stake is already claimed.

== 6003

::: warning Nosana Error

### `6003` - Already Staked

This stake is already staked.

== 6004

::: warning Nosana Error

### `6004` - Already Unstaked

This stake is already unstaked.

== 6005

::: warning Nosana Error

### `6005` - Not Unstaked

This stake is not yet unstaked.

== 6006

::: warning Nosana Error

### `6006` - Locked

This stake is still locked.

== 6007

::: warning Nosana Error

### `6007` - Duration Too Short

This stake duration is not long enough.

== 6008

::: warning Nosana Error

### `6008` - Duration Too Long

This stake duration is too long.

== 6009

::: warning Nosana Error

### `6009` - Does Not Exist

This stake account does not exist.

== 6010

::: warning Nosana Error

### `6010` - Decreased

This stake is not allowed to decrease.

== 6011

::: warning Nosana Error

### `6011` - Has Reward

This stake still has a reward account.

== 6012

::: warning Nosana Error

### `6012` - Invalid Stake Account

This stake does not belong to the authority.

:::

## Diagram

```mermaid
flowchart TB
    authority -->|stake<br>unstake<br>restake<br>extend<br>topup<br>claim| stake

    authority -.-|stake<br>unstake<br>topup<br>claim| nos  -.- vault
    stake     -.- xnos -.- network

    dao -->|slash| stake
    dao -->|updateSettings| settings

    authority(Staking Authority)
    dao(Nosana Voting)
    network(Nosana Network)
    stake{Stake Account}
    vault{Vault Account}
    settings{Settings Account}
    nos[NOS]
    xnos[xNOS]

    classDef orange fill:#f96,stroke:#333,stroke-width:3px;
    classDef yellow fill:#ff7,stroke:#333,stroke-width:2px;

    class stake,vault,settings orange
    class nos,xnos yellow
```

<!-- END_NOS_DOCS -->

## xNOS calculation

For people that like to know exactly how Nosana calculate a stakers's $xNOS$ score,
we've written it down as a function $f(NOS) = xNOS$.
Where $NOS$ denotes the number of [Nosana Tokens](/tokens/token) a staker has staked in the Nosana Staking Program.

$$
\begin{aligned}
f(NOS) &= xNOS \\
&= 1 \frac{ s }{ 10512000 } \times NOS \\
\\
s.t. &\phantom{=} \set{  s \in \mathbb{Z} \mid 1209600 \leq s \leq 31536000 }
\end{aligned}
$$

The $s$ parameter denotes time in seconds,
which represents the duration a staker has staked his or her tokens.
The parameter $s$ is subject to a [set](https://en.wikipedia.org/wiki/Set-builder_notation).
The stake duration $s$ belongs to the set of integers $\mathbb{Z}$,
such that $s$ is greater than or equal to $1209600$ seconds and less than or equal to $31536000$ seconds.

Because it's somewhat difficult to intuitively understand numbers of this magnitude,
we can simplify above function to use days rather seconds, which are denoted $d$.

$$
\begin{aligned}
xNOS &= 1 \frac{ d }{ 121 \frac{ 2 }{ 3 } } \times NOS \\
\\
s.t. &\phantom{=} \set{ d \in \mathbb{N} \mid 14 \leq s \leq 365 }
\end{aligned}
$$

The stake duration $d$ belongs to the set of natural numbers $\mathbb{N}$,
such that $d$ is greater than or equal to $14$ days and less than or equal to $365$ days.

In more simple phrasing.
A staker can stake Nosana Tokens for a minimum of two weeks and a maximum of one year.
The longer the duration of a stake, the higher the multiplier against the number of tokens in stake.
The maximum multiplier is this system is $4$, because $1 \frac{ 365 }{ 121 \frac{ 2 }{ 3 } } = 4$.

On the Nosana website you can find a [xNOS calculator](https://nosana.com/token).
