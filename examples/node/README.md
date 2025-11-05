# Nosana Kit Node.js Examples

This directory contains Node.js examples for using the Nosana Kit.

## Set Wallet Example

The `set-wallet.ts` example demonstrates various ways to initialize and set a wallet for the Nosana Client.

### Supported Wallet Formats

The `setWallet` method supports the following input formats:

1. **File Path**: Path to a JSON file containing a keypair array
2. **JSON Array String**: A string containing a JSON array of numbers representing the keypair
3. **Number Array**: A direct array of numbers representing the keypair
4. **Base58 String**: A base58-encoded private key
5. **Environment Variable**: Name of an environment variable containing the keypair data
6. **KeyPairSigner Object**: An existing KeyPairSigner instance

### Running the Example

```bash
# Navigate to the examples/node directory
cd examples/node

# Install dependencies
npm install

# Run the set-wallet example
npx ts-node set-wallet.ts
```

### Example Usage

```typescript
import { NosanaClient, NosanaNetwork } from '@nosana/kit';

const client = new NosanaClient(NosanaNetwork.DEVNET);

// From file path
await client.setWallet('./path/to/keypair.json');

// From JSON string
await client.setWallet('[174,47,154,16,...]');

// From number array
await client.setWallet([174, 47, 154, 16, ...]);

// From base58 string
await client.setWallet('base58EncodedPrivateKey');

// From environment variable
process.env.WALLET_KEY = '[174,47,154,16,...]';
await client.setWallet('WALLET_KEY');
```

### Quick Test

You can test the setWallet functionality manually by creating a simple test file:

```javascript
// test-setwallet.js
const { NosanaClient, NosanaNetwork } = require('@nosana/kit');

async function testSetWallet() {
  const client = new NosanaClient(NosanaNetwork.DEVNET);
  
  // Test with a sample keypair array
  const sampleKeypair = [
    174, 47, 154, 16, 202, 193, 206, 113, 199, 190, 53, 133, 169, 175, 31, 56, 222, 53, 138,
    189, 224, 216, 117, 173, 10, 149, 53, 45, 73, 251, 237, 246, 15, 185, 186, 82, 177, 240,
    148, 69, 241, 227, 167, 80, 141, 89, 240, 121, 121, 35, 172, 247, 68, 251, 226, 218, 48,
    63, 176, 109, 168, 89, 238, 135,
  ];
  
  try {
    const wallet = await client.setWallet(sampleKeypair);
    console.log('✅ Wallet set successfully!');
    console.log('Address:', wallet?.address);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSetWallet();
```

Run it with: `node test-setwallet.js`

### Error Handling

The `setWallet` method tries multiple conversion methods in sequence. If all methods fail, it throws a `NosanaError` with the code `WALLET_CONVERSION_ERROR`.

```typescript
try {
  await client.setWallet(walletData);
  console.log('Wallet set successfully:', client.wallet?.address);
} catch (error) {
  if (error instanceof NosanaError && error.code === ErrorCodes.WALLET_CONVERSION_ERROR) {
    console.error('Failed to set wallet:', error.message);
  }
}
```

### Implementation Details

The `setWallet` method in `src/index.ts` implements the following logic:

1. **KeyPairSigner Check**: If the input is already a KeyPairSigner object, it's used directly
2. **File Path Processing**: For strings that look like file paths (absolute, `./`, or `../`), it attempts to load the keypair from file
3. **Environment Variable**: Tries to load from environment variables (both JSON and base58 formats)
4. **JSON Parsing**: Attempts to parse JSON array strings
5. **Base58 Decoding**: Tries to decode base58-encoded strings  
6. **Array Processing**: Converts number arrays to Uint8Array for keypair creation

### Unit Tests

Comprehensive unit tests have been created in `src/__tests__/setWallet.test.ts` to cover:

- ✅ KeyPairSigner input handling
- ✅ File path validation and loading
- ✅ Environment variable processing
- ✅ JSON array string parsing
- ✅ Base58 string decoding
- ✅ Number array conversion
- ✅ Error handling for invalid inputs
- ✅ File path validation (absolute vs relative paths)

**Note**: Due to Jest/TypeScript configuration complexities with the `gill/dist/node` imports, running the tests may require additional setup. The functionality works correctly at runtime.

## NOS Token Service Example

The `nos-service.ts` example demonstrates how to interact with NOS token accounts using the NosService.

### Features

1. **Get all NOS token holders** - Fetch all token accounts holding NOS tokens (excludes zero balances by default)
2. **Include zero balance accounts** - Optional flag to include accounts with zero balance
3. **Exclude PDA accounts** - Filter out smart contract-owned token accounts (PDAs)
4. **Get token account for address** - Retrieve token account details for a specific owner
5. **Get balance** - Convenience method to get just the NOS balance
6. **Batch queries** - Fetch balances for multiple addresses
7. **Filter and analyze** - Find large holders and analyze token distribution

### Running the Example

```bash
# Navigate to the examples/node directory
cd examples/node

# Install dependencies
npm install

# Run the nos-service example
npm run nos-service
```

### Example Usage

```typescript
import { NosanaClient, NosanaNetwork } from '@nosana/kit';

const client = new NosanaClient(NosanaNetwork.MAINNET);

// Get all token holders (single RPC call, excludes zero balances by default)
const holders = await client.nos.getAllTokenHolders();
console.log(`Found ${holders.length} NOS token holders`);

// Include accounts with zero balance
const allAccounts = await client.nos.getAllTokenHolders({ includeZeroBalance: true });
console.log(`Total accounts: ${allAccounts.length}`);

// Exclude PDA accounts (smart contract-owned accounts)
const userAccounts = await client.nos.getAllTokenHolders({ excludePdaAccounts: true });
console.log(`User-owned accounts: ${userAccounts.length}`);

// Get token account for specific address
const account = await client.nos.getTokenAccountForAddress('owner-address');
if (account) {
  console.log(`Balance: ${account.uiAmount} NOS`);
}

// Get just the balance (convenience method)
const balance = await client.nos.getBalance('owner-address');
console.log(`Balance: ${balance} NOS`);

// Filter holders by minimum balance
const largeHolders = holders.filter(holder => holder.uiAmount >= 1000);
```

### Use Cases

- **Analytics**: Analyze token distribution and holder statistics
- **Airdrops**: Get list of all token holders for airdrop campaigns
- **Balance checks**: Check NOS balances for specific addresses
- **Leaderboards**: Create holder leaderboards sorted by balance
- **Monitoring**: Track large holder movements

## Stake Program Example

The `stake-program.ts` example demonstrates how to interact with Nosana staking accounts using the StakeProgram.

### Features

1. **Get all stake accounts** - Fetch all staking accounts on-chain
2. **Get single stake** - Fetch details of a specific stake account
3. **Get multiple stakes** - Fetch multiple stake accounts by address
4. **Analyze distribution** - Calculate staking statistics (total, average, largest)

### Running the Example

```bash
# Navigate to the examples/node directory
cd examples/node

# Install dependencies
npm install

# Run the stake-program example
npm run stake-program
```

### Example Usage

```typescript
import { NosanaClient, NosanaNetwork } from '@nosana/kit';

const client = new NosanaClient(NosanaNetwork.MAINNET);

// Get all stake accounts
const allStakes = await client.stake.all();
console.log(`Found ${allStakes.length} stake accounts`);

// Get single stake account
const stake = await client.stake.get('stake-account-address');
console.log(`Staked amount: ${stake.amount}`);
console.log(`xNOS tokens: ${stake.xnos}`);

// Analyze staking distribution
const totalStaked = allStakes.reduce((sum, s) => sum + s.amount, 0);
const averageStake = totalStaked / allStakes.length;
console.log(`Total staked: ${totalStaked.toLocaleString()}`);
console.log(`Average stake: ${averageStake.toLocaleString()}`);
```

## Other Examples

- `retrieve.ts` - Example of retrieving job data
- `monitor.ts` - Example of monitoring jobs

## Running Tests

To run all tests:
```bash
npm test
```

To run specific tests:
```bash
npm test -- --testNamePattern="setWallet"
``` 