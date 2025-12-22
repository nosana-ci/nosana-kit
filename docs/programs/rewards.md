# Nosana Rewards

The Nosana Rewards Program allow stakers to earn rewards.
Anyone that has staked NOS tokens can enter the rewards program.

The following are some of the Nosana Rewards program's characteristics:

- A staker's xNOS score determines the portion of the fees a user will receive.
- You have to explicitly `enter` the rewards program to participate. The rewards
  you receive are the percentage of your xNOS compared to that of all the other participants.
- When new fees are added to the program, they are distributed to all current participants.
- The program uses a token reflection model to distribute: fees are accounted
  for "live" as they come in and no loops necessary.
- Anyone can send in new fees to be distributed using `add_fees`.
- You can `claim` your earned rewards at any time (does not require an
  unstake).
- If you `unstake` your reward account is voided. It is _critical_ that
  you claim rewards before unstaking.
- If you `upstake` or `extend` a stake your rewards program is not updated. You
  will have to `claim` upate your reward to make use of your new xNOS score.
- A user can only have 1 active rewards entry at a time.
- The rewards a user earns are automatically added to the percentage of rewards
  they receive. Earned rewards are added to their xNOS score (with a
  multiplier of 1) - but can be claimed without any delay.
  They gain a slight advandage from this, and it's a great feature as well.
  Also it's easy to `upstake` your  rewards directly in order to receive a bigger multiplier.
- One can close their own reward account at any time. If there are any unclaimed rewards on the account,
  they will be cancelled (and distributed to all other participants).
- Anyone is permitted to close a user's reward account if they've unstaked.
  This feature prevents "ghost" accounts from accumulating rewards.

<!-- BEGIN_NOS_DOCS -->

## Program Information

| Info            | Description                                                                                                                         |
|-----------------|-------------------------------------------------------------------------------------------------------------------------------------|
| Type            | [Solana Program](https://docs.solana.com/developing/intro/programs#on-chain-programs)                                               |
| Source Code     | [GitHub](https://github.com/nosana-ci/nosana-programs)                                                                              |
| Build Status    | [Anchor Verified](https://www.apr.dev/program/nosRB8DUV67oLNrL45bo2pFLrmsWPiewe2Lk2DRNYCp)                                          |
| Accounts        | [`3`](#accounts)                                                                                                                    |
| Instructions    | [`6`](#instructions)                                                                                                                |
| Types           | [`0`](#types)                                                                                                                       |
| Errors          | [`0`](#errors)                                                                                                                      |
| Domain          | `nosana-rewards.sol`                                                                                                                |
|  Address        | [`nosRB8DUV67oLNrL45bo2pFLrmsWPiewe2Lk2DRNYCp`](https://explorer.solana.com/address/nosRB8DUV67oLNrL45bo2pFLrmsWPiewe2Lk2DRNYCp)    |

## Instructions

A number of 6 instruction are defined in the Nosana Rewards program.

To load the program with [Anchor](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
const programId = new PublicKey('nosRB8DUV67oLNrL45bo2pFLrmsWPiewe2Lk2DRNYCp');
const idl = await Program.fetchIdl(programId.toString());
const program = new Program(idl, programId);
```

:::tabs

== Init
### Init

Initialize the [ReflectionAccount](#reflection-account) and [VaultAccount](#vault-account).

#### Account Info

The following 7 account addresses should be provided when invoking this instruction.

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `mint`                 | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The token Mint address for this instruction.                                                      |
| `reflection`           | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [ReflectionAccount](#reflection-account) address.                                             |
| `vault`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [VaultAccount](#vault-account) address.                                                       |
| `authority`            | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="#3EAF7C" />       | The signing authority of the program invocation.                                                  |
| `systemProgram`        | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The official Solana system program address. Responsible for system CPIs.                          |
| `tokenProgram`         | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The official SPL Token Program address. Responsible for token CPIs.                               |
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
    mint,              // 𐄂 writable, 𐄂 signer
    reflection,        // ✓ writable, 𐄂 signer
    vault,             // ✓ writable, 𐄂 signer
    authority,         // ✓ writable, ✓ signer
    systemProgram,     // 𐄂 writable, 𐄂 signer
    tokenProgram,      // 𐄂 writable, 𐄂 signer
    rent,              // 𐄂 writable, 𐄂 signer
  })
  .signers([authorityKey])
  .rpc();
```

== Enter
### Enter

Initialize a [RewardsAccount](#rewards-account).

#### Account Info

The following 5 account addresses should be provided when invoking this instruction.

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `reflection`           | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [ReflectionAccount](#reflection-account) address.                                             |
| `stake`                | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The [StakeAccount](/programs/staking#stake-account) address.                                      |
| `reward`               | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [RewardAccount](#reward-account) address.                                                     |
| `authority`            | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="#3EAF7C" />       | The signing authority of the program invocation.                                                  |
| `systemProgram`        | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The official Solana system program address. Responsible for system CPIs.                          |

::: details Solana Dispatch ID

The Solana dispatch ID for the Enter Instruction
is **`8b31d172585b4d86`**,
which can also be expressed as an 8 byte discriminator:

```json
[139,49,209,114,88,91,77,134]
```

::: details Example with Anchor

To invoke the Enter Instruction
with [Anchor TS](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .enter()
  .accounts({
    reflection,        // ✓ writable, 𐄂 signer
    stake,             // 𐄂 writable, 𐄂 signer
    reward,            // ✓ writable, 𐄂 signer
    authority,         // ✓ writable, ✓ signer
    systemProgram,     // 𐄂 writable, 𐄂 signer
  })
  .signers([authorityKey])
  .rpc();
```

== Add Fee
### Add Fee

Send [NOS](/tokens/token) to the [VaultAccount](#vault-account).

#### Account Info

The following 5 account addresses should be provided when invoking this instruction.

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `user`                 | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The user token account that will debit/credit the tokens.                                         |
| `reflection`           | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [ReflectionAccount](#reflection-account) address.                                             |
| `vault`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [VaultAccount](#vault-account) address.                                                       |
| `authority`            | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="#3EAF7C" />     | The signing authority of the program invocation.                                                  |
| `tokenProgram`         | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The official SPL Token Program address. Responsible for token CPIs.                               |

#### Arguments

The following 1 arguments should also be provided when invoking this instruction.

| Name                   | Type              | Size    | Offset  | Description                                               |
|------------------------|-------------------|---------|---------|-----------------------------------------------------------|
| `amount`               | `u64`             | `8`     | `0`     | The number of tokens.                                     |

::: details Solana Dispatch ID

The Solana dispatch ID for the Add Fee Instruction
is **`43e1bdd4fd7b4c70`**,
which can also be expressed as an 8 byte discriminator:

```json
[67,225,189,212,253,123,76,112]
```

::: details Example with Anchor

To invoke the Add Fee Instruction
with [Anchor TS](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .addFee(
    amount,            // type: u64
  )
  .accounts({
    user,              // ✓ writable, 𐄂 signer
    reflection,        // ✓ writable, 𐄂 signer
    vault,             // ✓ writable, 𐄂 signer
    authority,         // 𐄂 writable, ✓ signer
    tokenProgram,      // 𐄂 writable, 𐄂 signer
  })
  .signers([authorityKey])
  .rpc();
```

== Claim
### Claim

Claim rewards from a [RewardsAccount](#rewards-account) and [VaultAccount](#vault-account).

#### Account Info

The following 7 account addresses should be provided when invoking this instruction.

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `user`                 | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The user token account that will debit/credit the tokens.                                         |
| `vault`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [VaultAccount](#vault-account) address.                                                       |
| `reflection`           | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [ReflectionAccount](#reflection-account) address.                                             |
| `reward`               | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [RewardAccount](#reward-account) address.                                                     |
| `stake`                | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The [StakeAccount](/programs/staking#stake-account) address.                                      |
| `authority`            | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="#3EAF7C" />       | The signing authority of the program invocation.                                                  |
| `tokenProgram`         | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The official SPL Token Program address. Responsible for token CPIs.                               |

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
    user,              // ✓ writable, 𐄂 signer
    vault,             // ✓ writable, 𐄂 signer
    reflection,        // ✓ writable, 𐄂 signer
    reward,            // ✓ writable, 𐄂 signer
    stake,             // 𐄂 writable, 𐄂 signer
    authority,         // ✓ writable, ✓ signer
    tokenProgram,      // 𐄂 writable, 𐄂 signer
  })
  .signers([authorityKey])
  .rpc();
```

== Sync
### Sync

Re-calculate reflection points.

#### Account Info

The following 3 account addresses should be provided when invoking this instruction.

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `reward`               | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [RewardAccount](#reward-account) address.                                                     |
| `stake`                | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The [StakeAccount](/programs/staking#stake-account) address.                                      |
| `reflection`           | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [ReflectionAccount](#reflection-account) address.                                             |

::: details Solana Dispatch ID

The Solana dispatch ID for the Sync Instruction
is **`04db28a4159dbd58`**,
which can also be expressed as an 8 byte discriminator:

```json
[4,219,40,164,21,157,189,88]
```

::: details Example with Anchor

To invoke the Sync Instruction
with [Anchor TS](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .sync()
  .accounts({
    reward,            // ✓ writable, 𐄂 signer
    stake,             // 𐄂 writable, 𐄂 signer
    reflection,        // ✓ writable, 𐄂 signer
  })
  .rpc();
```

== Close
### Close

Close a [RewardsAccount](#rewards-account).

#### Account Info

The following 3 account addresses should be provided when invoking this instruction.

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `reflection`           | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [ReflectionAccount](#reflection-account) address.                                             |
| `reward`               | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [RewardAccount](#reward-account) address.                                                     |
| `authority`            | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="#3EAF7C" />       | The signing authority of the program invocation.                                                  |

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
    reflection,        // ✓ writable, 𐄂 signer
    reward,            // ✓ writable, 𐄂 signer
    authority,         // ✓ writable, ✓ signer
  })
  .signers([authorityKey])
  .rpc();
```

:::
## Accounts

A number of 3 accounts make up for the Nosana Rewards Program's state.

:::tabs

== Reflection Account
### Reflection Account

The `ReflectionAccount` struct holds all the information on the reflection pool.
The total size of this account is `89` bytes.

| Name                        | Type                        | Size    | Offset  | Description                                                                                       |
|-----------------------------|-----------------------------|---------|---------|---------------------------------------------------------------------------------------------------|
| `rate`                      | `u128`                      | `16`    | `8`     | The current reward rate.                                                                          |
| `totalReflection`           | `u128`                      | `16`    | `24`    | The current total reflection.                                                                     |
| `totalXnos`                 | `u128`                      | `16`    | `40`    | The current total xNOS.                                                                           |
| `vault`                     | `publicKey`                 | `32`    | `56`    | The [VaultAccount](#vault-account) address.                                                       |
| `vaultBump`                 | `u8`                        | `1`     | `88`    | The bump for the [VaultAccount](#vault-account).                                                  |

::: details Anchor Account Discriminator

The first 8 bytes, also known as Anchor's 8 byte discriminator, for the Reflection Account
are **`cd99a036ef1adbbc`**, which can also be expressed in byte array:

```json
[205,153,160,54,239,26,219,188]
```

== Reward Account
### Reward Account

The `RewardAccount` struct holds all the information for any given user account.
The total size of this account is `73` bytes.

| Name                        | Type                        | Size    | Offset  | Description                                                                                       |
|-----------------------------|-----------------------------|---------|---------|---------------------------------------------------------------------------------------------------|
| `authority`                 | `publicKey`                 | `32`    | `8`     | The signing authority of the program invocation.                                                  |
| `bump`                      | `u8`                        | `1`     | `40`    | n/a                                                                                               |
| `reflection`                | `u128`                      | `16`    | `41`    | The [ReflectionAccount](#reflection-account) address.                                             |
| `xnos`                      | `u128`                      | `16`    | `57`    | n/a                                                                                               |

::: details Anchor Account Discriminator

The first 8 bytes, also known as Anchor's 8 byte discriminator, for the Reward Account
are **`e1511ffd54eaab81`**, which can also be expressed in byte array:

```json
[225,81,31,253,84,234,171,129]
```

== Vault Account
### Vault Account

The `VaultAccount` is a regular Solana Token Account.

:::

## Diagram

```mermaid
flowchart TB
    authority -->|enter| reward
    authority -->|claim| reward
    authority -->|close| reward

    anybody -->|sync| reflection
    anybody -->|sync| reward

    network -->|addFee| reflection
    network -.- nos1 -.-> vault -.- nos2 -.-> authority

    authority(Staking Authority)
    network(Nosana Network)
    anybody(Anonymous)
    reward{Reward Account}
    vault{Vault Account}
    reflection{Reflection Account}
    nos1[NOS]
    nos2[NOS]

    classDef orange fill:#f96,stroke:#333,stroke-width:3px;
    classDef yellow fill:#ff7,stroke:#333,stroke-width:2px;

    class reward,vault,reflection orange
    class nos1,nos2 yellow
```

<!-- END_NOS_DOCS -->
