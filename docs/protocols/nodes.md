# Nosana Nodes

The Nosana Nodes program allows users to register machine in the Nosana Network.

<!-- BEGIN_NOS_DOCS -->

## Program Information

| Info            | Description                                                                                                                         |
|-----------------|-------------------------------------------------------------------------------------------------------------------------------------|
| Type            | [Solana Program](https://docs.solana.com/developing/intro/programs#on-chain-programs)                                               |
| Source Code     | [GitHub](https://github.com/nosana-ci/nosana-programs)                                                                              |
| Build Status    | [Anchor Verified](https://www.apr.dev/program/nosNeZR64wiEhQc5j251bsP4WqDabT6hmz4PHyoHLGD)                                          |
| Accounts        | [`2`](#accounts)                                                                                                                    |
| Instructions    | [`3`](#instructions)                                                                                                                |
| Types           | [`2`](#types)                                                                                                                       |
| Errors          | [`7`](#errors)                                                                                                                      |
| Domain          | `nosana-nodes.sol`                                                                                                                  |
|  Address        | [`nosNeZR64wiEhQc5j251bsP4WqDabT6hmz4PHyoHLGD`](https://explorer.solana.com/address/nosNeZR64wiEhQc5j251bsP4WqDabT6hmz4PHyoHLGD)    |

## Instructions

A number of 3 instruction are defined in the Nosana Nodes program.

To load the program with [Anchor](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
const programId = new PublicKey('nosNeZR64wiEhQc5j251bsP4WqDabT6hmz4PHyoHLGD');
const idl = await Program.fetchIdl(programId.toString());
const program = new Program(idl, programId);
```

:::tabs

== Register
### Register

Register a node to the Nosana Network

#### Account Info

The following 4 account addresses should be provided when invoking this instruction.

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `node`                 | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The node that runs this job.                                                                      |
| `payer`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="#3EAF7C" />       | The paying identy for the rent.                                                                   |
| `authority`            | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="#3EAF7C" />     | The signing authority of the program invocation.                                                  |
| `systemProgram`        | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The official Solana system program address. Responsible for system CPIs.                          |

#### Arguments

The following 10 arguments should also be provided when invoking this instruction.

| Name                   | Type              | Size    | Offset  | Description                                               |
|------------------------|-------------------|---------|---------|-----------------------------------------------------------|
| `architectureType`     | `u8`              | `1`     | `0`     | The [ArchitectureType](#architecture-type) of the node.   |
| `countryCode`          | `u16`             | `2`     | `1`     | The [CountryCode](#country-code) of the node.             |
| `cpu`                  | `u16`             | `2`     | `3`     | The number of vCPU cores a node has.                      |
| `gpu`                  | `u16`             | `2`     | `5`     | The number of GPU cores a node has.                       |
| `memory`               | `u16`             | `2`     | `7`     | Memory capacity of a node in GB.                          |
| `iops`                 | `u16`             | `2`     | `9`     | Input/output operations per second of a node.             |
| `storage`              | `u16`             | `2`     | `11`    | Storage capacity of a node in GB.                         |
| `endpoint`             | `string`          | `undefined`| `13`    | HTTP endpoint for log streaming and results.              |
| `icon`                 | `string`          | `undefined`| `NaN`   | n/a                                                       |
| `version`              | `string`          | `undefined`| `NaN`   | The version of the nosana node software they are running. |

::: details Solana Dispatch ID

The Solana dispatch ID for the Register Instruction
is **`d37c430fd3c2b2f0`**,
which can also be expressed as an 8 byte discriminator:

```json
[211,124,67,15,211,194,178,240]
```

::: details Example with Anchor

To invoke the Register Instruction
with [Anchor TS](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .register(
    architectureType,  // type: u8
    countryCode,       // type: u16
    cpu,               // type: u16
    gpu,               // type: u16
    memory,            // type: u16
    iops,              // type: u16
    storage,           // type: u16
    endpoint,          // type: string
    icon,              // type: string
    version,           // type: string
  )
  .accounts({
    node,              // ✓ writable, 𐄂 signer
    payer,             // ✓ writable, ✓ signer
    authority,         // 𐄂 writable, ✓ signer
    systemProgram,     // 𐄂 writable, 𐄂 signer
  })
  .signers([payerKey, authorityKey])
  .rpc();
```

== Audit
### Audit

#### Account Info

The following 2 account addresses should be provided when invoking this instruction.

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `node`                 | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The node that runs this job.                                                                      |
| `authority`            | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="#3EAF7C" />     | The signing authority of the program invocation.                                                  |

#### Arguments

The following 1 arguments should also be provided when invoking this instruction.

| Name                   | Type              | Size    | Offset  | Description                                               |
|------------------------|-------------------|---------|---------|-----------------------------------------------------------|
| `audited`              | `bool`            | `1`     | `0`     | n/a                                                       |

::: details Solana Dispatch ID

The Solana dispatch ID for the Audit Instruction
is **`73eb2601733ada51`**,
which can also be expressed as an 8 byte discriminator:

```json
[115,235,38,1,115,58,218,81]
```

::: details Example with Anchor

To invoke the Audit Instruction
with [Anchor TS](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .audit(
    audited,           // type: bool
  )
  .accounts({
    node,              // ✓ writable, 𐄂 signer
    authority,         // 𐄂 writable, ✓ signer
  })
  .signers([authorityKey])
  .rpc();
```

== Update
### Update

Update a node to the Nosana Network

#### Account Info

The following 2 account addresses should be provided when invoking this instruction.

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `node`                 | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The node that runs this job.                                                                      |
| `authority`            | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="#3EAF7C" />     | The signing authority of the program invocation.                                                  |

#### Arguments

The following 10 arguments should also be provided when invoking this instruction.

| Name                   | Type              | Size    | Offset  | Description                                               |
|------------------------|-------------------|---------|---------|-----------------------------------------------------------|
| `architectureType`     | `u8`              | `1`     | `0`     | The [ArchitectureType](#architecture-type) of the node.   |
| `countryCode`          | `u16`             | `2`     | `1`     | The [CountryCode](#country-code) of the node.             |
| `cpu`                  | `u16`             | `2`     | `3`     | The number of vCPU cores a node has.                      |
| `gpu`                  | `u16`             | `2`     | `5`     | The number of GPU cores a node has.                       |
| `memory`               | `u16`             | `2`     | `7`     | Memory capacity of a node in GB.                          |
| `iops`                 | `u16`             | `2`     | `9`     | Input/output operations per second of a node.             |
| `storage`              | `u16`             | `2`     | `11`    | Storage capacity of a node in GB.                         |
| `endpoint`             | `string`          | `undefined`| `13`    | HTTP endpoint for log streaming and results.              |
| `icon`                 | `string`          | `undefined`| `NaN`   | n/a                                                       |
| `version`              | `string`          | `undefined`| `NaN`   | The version of the nosana node software they are running. |

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
    architectureType,  // type: u8
    countryCode,       // type: u16
    cpu,               // type: u16
    gpu,               // type: u16
    memory,            // type: u16
    iops,              // type: u16
    storage,           // type: u16
    endpoint,          // type: string
    icon,              // type: string
    version,           // type: string
  )
  .accounts({
    node,              // ✓ writable, 𐄂 signer
    authority,         // 𐄂 writable, ✓ signer
  })
  .signers([authorityKey])
  .rpc();
```

:::
## Accounts

A number of 2 accounts make up for the Nosana Nodes Program's state.

:::tabs

== Node Account
### Node Account

The `NodeAccount` struct holds all the information for any given node.
The total size of this account is `NaN` bytes.

| Name                        | Type                        | Size    | Offset  | Description                                                                                       |
|-----------------------------|-----------------------------|---------|---------|---------------------------------------------------------------------------------------------------|
| `authority`                 | `publicKey`                 | `32`    | `8`     | The signing authority of the program invocation.                                                  |
| `audited`                   | `bool`                      | `1`     | `40`    | n/a                                                                                               |
| `architecture`              | `u8`                        | `1`     | `41`    | n/a                                                                                               |
| `country`                   | `u16`                       | `2`     | `42`    | n/a                                                                                               |
| `cpu`                       | `u16`                       | `2`     | `44`    | The number of vCPU cores a node has.                                                              |
| `gpu`                       | `u16`                       | `2`     | `46`    | The number of GPU cores a node has.                                                               |
| `memory`                    | `u16`                       | `2`     | `48`    | Memory capacity of a node in GB.                                                                  |
| `iops`                      | `u16`                       | `2`     | `50`    | Input/output operations per second of a node.                                                     |
| `storage`                   | `u16`                       | `2`     | `52`    | Storage capacity of a node in GB.                                                                 |
| `endpoint`                  | `string`                    | `undefined`| `54`    | HTTP endpoint for log streaming and results.                                                      |
| `icon`                      | `string`                    | `undefined`| `NaN`   | n/a                                                                                               |
| `version`                   | `string`                    | `undefined`| `NaN`   | The version of the nosana node software they are running.                                         |

::: details Anchor Account Discriminator

The first 8 bytes, also known as Anchor's 8 byte discriminator, for the Node Account
are **`7da61292c37f56dc`**, which can also be expressed in byte array:

```json
[125,166,18,146,195,127,86,220]
```

== Vault Account
### Vault Account

The `VaultAccount` is a regular Solana Token Account.

:::

## Types

A number of 2 type variants are defined in the Nosana Nodes Program's state.

::: tabs

== Architecture Type
### Architecture Type

The `ArchitectureType` describes the type of chip architecture the node has

A number of 11 variants are defined in this `enum`:
| Name                                  | Number                                |
|---------------------------------------|---------------------------------------|
| `Amd64`                               | `0`                                   |
| `Arm32v6`                             | `1`                                   |
| `Arm32v7`                             | `2`                                   |
| `Arm64v8`                             | `3`                                   |
| `WindowsAmd64`                        | `4`                                   |
| `Ppc64le`                             | `5`                                   |
| `S390x`                               | `6`                                   |
| `Mips64le`                            | `7`                                   |
| `Riscv64`                             | `8`                                   |
| `I386`                                | `9`                                   |
| `Unknown`                             | `255`                                 |

== Country Code
### Country Code

The `CountryCode` represent the ISO code for a country

A number of 250 variants are defined in this `enum`:
| Name                                  | Number                                |
|---------------------------------------|---------------------------------------|
| `AD`                                  | `0`                                   |
| `AE`                                  | `1`                                   |
| `AF`                                  | `2`                                   |
| `AG`                                  | `3`                                   |
| `AI`                                  | `4`                                   |
| `AL`                                  | `5`                                   |
| `AM`                                  | `6`                                   |
| `AO`                                  | `7`                                   |
| `AQ`                                  | `8`                                   |
| `AR`                                  | `9`                                   |
| `AS`                                  | `10`                                  |
| `AT`                                  | `11`                                  |
| `AU`                                  | `12`                                  |
| `AW`                                  | `13`                                  |
| `AX`                                  | `14`                                  |
| `AZ`                                  | `15`                                  |
| `BA`                                  | `16`                                  |
| `BB`                                  | `17`                                  |
| `BD`                                  | `18`                                  |
| `BE`                                  | `19`                                  |
| `BF`                                  | `20`                                  |
| `BG`                                  | `21`                                  |
| `BH`                                  | `22`                                  |
| `BI`                                  | `23`                                  |
| `BJ`                                  | `24`                                  |
| `BL`                                  | `25`                                  |
| `BM`                                  | `26`                                  |
| `BN`                                  | `27`                                  |
| `BO`                                  | `28`                                  |
| `BQ`                                  | `29`                                  |
| `BR`                                  | `30`                                  |
| `BS`                                  | `31`                                  |
| `BT`                                  | `32`                                  |
| `BV`                                  | `33`                                  |
| `BW`                                  | `34`                                  |
| `BY`                                  | `35`                                  |
| `BZ`                                  | `36`                                  |
| `CA`                                  | `37`                                  |
| `CC`                                  | `38`                                  |
| `CD`                                  | `39`                                  |
| `CF`                                  | `40`                                  |
| `CG`                                  | `41`                                  |
| `CH`                                  | `42`                                  |
| `CI`                                  | `43`                                  |
| `CK`                                  | `44`                                  |
| `CL`                                  | `45`                                  |
| `CM`                                  | `46`                                  |
| `CN`                                  | `47`                                  |
| `CO`                                  | `48`                                  |
| `CR`                                  | `49`                                  |
| `CU`                                  | `50`                                  |
| `CV`                                  | `51`                                  |
| `CW`                                  | `52`                                  |
| `CX`                                  | `53`                                  |
| `CY`                                  | `54`                                  |
| `CZ`                                  | `55`                                  |
| `DE`                                  | `56`                                  |
| `DJ`                                  | `57`                                  |
| `DK`                                  | `58`                                  |
| `DM`                                  | `59`                                  |
| `DO`                                  | `60`                                  |
| `DZ`                                  | `61`                                  |
| `EC`                                  | `62`                                  |
| `EE`                                  | `63`                                  |
| `EG`                                  | `64`                                  |
| `EH`                                  | `65`                                  |
| `ER`                                  | `66`                                  |
| `ES`                                  | `67`                                  |
| `ET`                                  | `68`                                  |
| `FI`                                  | `69`                                  |
| `FJ`                                  | `70`                                  |
| `FK`                                  | `71`                                  |
| `FM`                                  | `72`                                  |
| `FO`                                  | `73`                                  |
| `FR`                                  | `74`                                  |
| `GA`                                  | `75`                                  |
| `GB`                                  | `76`                                  |
| `GD`                                  | `77`                                  |
| `GE`                                  | `78`                                  |
| `GF`                                  | `79`                                  |
| `GG`                                  | `80`                                  |
| `GH`                                  | `81`                                  |
| `GI`                                  | `82`                                  |
| `GL`                                  | `83`                                  |
| `GM`                                  | `84`                                  |
| `GN`                                  | `85`                                  |
| `GP`                                  | `86`                                  |
| `GQ`                                  | `87`                                  |
| `GR`                                  | `88`                                  |
| `GS`                                  | `89`                                  |
| `GT`                                  | `90`                                  |
| `GU`                                  | `91`                                  |
| `GW`                                  | `92`                                  |
| `GY`                                  | `93`                                  |
| `HK`                                  | `94`                                  |
| `HM`                                  | `95`                                  |
| `HN`                                  | `96`                                  |
| `HR`                                  | `97`                                  |
| `HT`                                  | `98`                                  |
| `HU`                                  | `99`                                  |
| `ID`                                  | `100`                                 |
| `IE`                                  | `101`                                 |
| `IL`                                  | `102`                                 |
| `IM`                                  | `103`                                 |
| `IN`                                  | `104`                                 |
| `IO`                                  | `105`                                 |
| `IQ`                                  | `106`                                 |
| `IR`                                  | `107`                                 |
| `IS`                                  | `108`                                 |
| `IT`                                  | `109`                                 |
| `JE`                                  | `110`                                 |
| `JM`                                  | `111`                                 |
| `JO`                                  | `112`                                 |
| `JP`                                  | `113`                                 |
| `KE`                                  | `114`                                 |
| `KG`                                  | `115`                                 |
| `KH`                                  | `116`                                 |
| `KI`                                  | `117`                                 |
| `KM`                                  | `118`                                 |
| `KN`                                  | `119`                                 |
| `KP`                                  | `120`                                 |
| `KR`                                  | `121`                                 |
| `KW`                                  | `122`                                 |
| `KY`                                  | `123`                                 |
| `KZ`                                  | `124`                                 |
| `LA`                                  | `125`                                 |
| `LB`                                  | `126`                                 |
| `LC`                                  | `127`                                 |
| `LI`                                  | `128`                                 |
| `LK`                                  | `129`                                 |
| `LR`                                  | `130`                                 |
| `LS`                                  | `131`                                 |
| `LT`                                  | `132`                                 |
| `LU`                                  | `133`                                 |
| `LV`                                  | `134`                                 |
| `LY`                                  | `135`                                 |
| `MA`                                  | `136`                                 |
| `MC`                                  | `137`                                 |
| `MD`                                  | `138`                                 |
| `ME`                                  | `139`                                 |
| `MF`                                  | `140`                                 |
| `MG`                                  | `141`                                 |
| `MH`                                  | `142`                                 |
| `MK`                                  | `143`                                 |
| `ML`                                  | `144`                                 |
| `MM`                                  | `145`                                 |
| `MN`                                  | `146`                                 |
| `MO`                                  | `147`                                 |
| `MP`                                  | `148`                                 |
| `MQ`                                  | `149`                                 |
| `MR`                                  | `150`                                 |
| `MS`                                  | `151`                                 |
| `MT`                                  | `152`                                 |
| `MU`                                  | `153`                                 |
| `MV`                                  | `154`                                 |
| `MW`                                  | `155`                                 |
| `MX`                                  | `156`                                 |
| `MY`                                  | `157`                                 |
| `MZ`                                  | `158`                                 |
| `NA`                                  | `159`                                 |
| `NC`                                  | `160`                                 |
| `NE`                                  | `161`                                 |
| `NF`                                  | `162`                                 |
| `NG`                                  | `163`                                 |
| `NI`                                  | `164`                                 |
| `NL`                                  | `165`                                 |
| `NO`                                  | `166`                                 |
| `NP`                                  | `167`                                 |
| `NR`                                  | `168`                                 |
| `NU`                                  | `169`                                 |
| `NZ`                                  | `170`                                 |
| `OM`                                  | `171`                                 |
| `PA`                                  | `172`                                 |
| `PE`                                  | `173`                                 |
| `PF`                                  | `174`                                 |
| `PG`                                  | `175`                                 |
| `PH`                                  | `176`                                 |
| `PK`                                  | `177`                                 |
| `PL`                                  | `178`                                 |
| `PM`                                  | `179`                                 |
| `PN`                                  | `180`                                 |
| `PR`                                  | `181`                                 |
| `PS`                                  | `182`                                 |
| `PT`                                  | `183`                                 |
| `PW`                                  | `184`                                 |
| `PY`                                  | `185`                                 |
| `QA`                                  | `186`                                 |
| `RE`                                  | `187`                                 |
| `RO`                                  | `188`                                 |
| `RS`                                  | `189`                                 |
| `RU`                                  | `190`                                 |
| `RW`                                  | `191`                                 |
| `SA`                                  | `192`                                 |
| `SB`                                  | `193`                                 |
| `SC`                                  | `194`                                 |
| `SD`                                  | `195`                                 |
| `SE`                                  | `196`                                 |
| `SG`                                  | `197`                                 |
| `SH`                                  | `198`                                 |
| `SI`                                  | `199`                                 |
| `SJ`                                  | `200`                                 |
| `SK`                                  | `201`                                 |
| `SL`                                  | `202`                                 |
| `SM`                                  | `203`                                 |
| `SN`                                  | `204`                                 |
| `SO`                                  | `205`                                 |
| `SR`                                  | `206`                                 |
| `SS`                                  | `207`                                 |
| `ST`                                  | `208`                                 |
| `SV`                                  | `209`                                 |
| `SX`                                  | `210`                                 |
| `SY`                                  | `211`                                 |
| `SZ`                                  | `212`                                 |
| `TC`                                  | `213`                                 |
| `TD`                                  | `214`                                 |
| `TF`                                  | `215`                                 |
| `TG`                                  | `216`                                 |
| `TH`                                  | `217`                                 |
| `TJ`                                  | `218`                                 |
| `TK`                                  | `219`                                 |
| `TL`                                  | `220`                                 |
| `TM`                                  | `221`                                 |
| `TN`                                  | `222`                                 |
| `TO`                                  | `223`                                 |
| `TR`                                  | `224`                                 |
| `TT`                                  | `225`                                 |
| `TV`                                  | `226`                                 |
| `TW`                                  | `227`                                 |
| `TZ`                                  | `228`                                 |
| `UA`                                  | `229`                                 |
| `UG`                                  | `230`                                 |
| `UM`                                  | `231`                                 |
| `US`                                  | `232`                                 |
| `UY`                                  | `233`                                 |
| `UZ`                                  | `234`                                 |
| `VA`                                  | `235`                                 |
| `VC`                                  | `236`                                 |
| `VE`                                  | `237`                                 |
| `VG`                                  | `238`                                 |
| `VI`                                  | `239`                                 |
| `VN`                                  | `240`                                 |
| `VU`                                  | `241`                                 |
| `WF`                                  | `242`                                 |
| `WS`                                  | `243`                                 |
| `YE`                                  | `244`                                 |
| `YT`                                  | `245`                                 |
| `ZA`                                  | `246`                                 |
| `ZM`                                  | `247`                                 |
| `ZW`                                  | `248`                                 |
| `Unknown`                             | `255`                                 |

## Errors

A number of 7 errors are defined in the Nosana Nodes Program.

:::tabs

== 6000

::: warning Nosana Error

### `6000` - Architecture Unknown

This architecture does not exist.

== 6001

::: warning Nosana Error

### `6001` - Country Code Unknown

This country does not exist.

== 6002

::: warning Nosana Error

### `6002` - Cpu Invalid

CPU value must be greater than zero

== 6003

::: warning Nosana Error

### `6003` - Gpu Invalid

GPU value must be greater than zero

== 6004

::: warning Nosana Error

### `6004` - Memory Invalid

Memory value must be greater than zero

== 6005

::: warning Nosana Error

### `6005` - Iops Invalid

IOPS value must be greater than zero

== 6006

::: warning Nosana Error

### `6006` - Storage Invalid

Storage value must be greater than zero

:::

## Diagram

```mermaid
flowchart TB
    authority -->|register<br>update| node

    authority(Node Authority)
    node{Node Account}

    classDef orange fill:#f96,stroke:#333,stroke-width:3px;

    class stake orange
```

<!-- END_NOS_DOCS -->
