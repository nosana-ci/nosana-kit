/**
 * Example: Using the NosService to interact with NOS token accounts
 * 
 * This example demonstrates how to use the NosService to:
 * 1. Get all NOS token holders
 * 2. Get a specific token account for an address
 * 3. Get the NOS balance for an address
 */

import { NosanaClient, NosanaNetwork } from '@nosana/kit';

async function main() {
  // Initialize the Nosana client (use MAINNET for real data)
  const client = new NosanaClient(NosanaNetwork.MAINNET);

  // Example 1: Get all NOS token holders (excludes zero balance by default)
  console.log('Fetching all NOS token holders...');
  try {
    const holders = await client.nos.getAllTokenHolders();

    console.log(`Found ${holders.length} NOS token holders (with non-zero balances)`);

    // Display first 5 holders
    holders.slice(0, 5).forEach((holder, index) => {
      console.log(`\nHolder ${index + 1}:`);
      console.log(`  Token Account: ${holder.pubkey}`);
      console.log(`  Owner: ${holder.owner}`);
      console.log(`  Balance: ${holder.uiAmount} NOS`);
      console.log(`  Raw Amount: ${holder.amount.toString()}`);
      console.log(`  Decimals: ${holder.decimals}`);
    });

    // Include zero balance accounts
    console.log('\nFetching all accounts including zero balances...');
    const allAccounts = await client.token.getAllTokenHolders({ includeZeroBalance: true });
    console.log(`Total accounts (including zero balance): ${allAccounts.length}`);
    console.log(`Accounts with zero balance: ${allAccounts.length - holders.length}`);

    // Exclude PDA accounts (smart contract-owned accounts)
    console.log('\nFetching user-owned accounts only (excluding PDAs)...');
    const userAccounts = await client.token.getAllTokenHolders({ excludePdaAccounts: true });
    console.log(`User-owned accounts: ${userAccounts.length}`);
    console.log(`PDA accounts: ${holders.length - userAccounts.length}`);
  } catch (error) {
    console.error('Error fetching token holders:', error);
  }

  // Example 2: Get token account for a specific address
  const ownerAddress = 'YourWalletAddressHere';

  console.log(`\nFetching NOS token account for ${ownerAddress}...`);
  try {
    const account = await client.nos.getTokenAccountForAddress(ownerAddress);

    if (account) {
      console.log('Token Account found:');
      console.log(`  Account Address: ${account.pubkey}`);
      console.log(`  Owner: ${account.owner}`);
      console.log(`  Mint: ${account.mint}`);
      console.log(`  Balance: ${account.uiAmount} NOS`);
      console.log(`  Raw Amount: ${account.amount.toString()}`);
      console.log(`  Decimals: ${account.decimals}`);
    } else {
      console.log('No NOS token account found for this address');
    }
  } catch (error) {
    console.error('Error fetching token account:', error);
  }

  // Example 3: Get just the balance (convenience method)
  console.log(`\nFetching NOS balance for ${ownerAddress}...`);
  try {
    const balance = await client.nos.getBalance(ownerAddress);
    console.log(`Balance: ${balance} NOS`);
  } catch (error) {
    console.error('Error fetching balance:', error);
  }

  // Example 4: Working with multiple addresses
  const addresses = [
    'Address1Here',
    'Address2Here',
    'Address3Here',
  ];

  console.log('\nFetching balances for multiple addresses...');
  for (const addr of addresses) {
    try {
      const balance = await client.nos.getBalance(addr);
      console.log(`${addr}: ${balance} NOS`);
    } catch (error) {
      console.error(`Error fetching balance for ${addr}:`, error);
    }
  }

  // Example 5: Filter holders by minimum balance
  console.log('\nFinding holders with at least 1000 NOS...');
  try {
    const holders = await client.nos.getAllTokenHolders();
    const largeHolders = holders.filter(holder => holder.uiAmount >= 1000);

    console.log(`Found ${largeHolders.length} holders with >= 1000 NOS`);

    // Sort by balance descending
    const sorted = largeHolders.sort((a, b) => b.uiAmount - a.uiAmount);

    // Display top 10
    sorted.slice(0, 10).forEach((holder, index) => {
      console.log(`${index + 1}. ${holder.owner}: ${holder.uiAmount.toLocaleString()} NOS`);
    });
  } catch (error) {
    console.error('Error analyzing holders:', error);
  }
}

main().catch(console.error);

