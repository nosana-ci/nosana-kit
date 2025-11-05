/**
 * Example: Using the StakeProgram to interact with staking accounts
 * 
 * This example demonstrates how to use the StakeProgram to:
 * 1. Get all stake accounts
 * 2. Get stake accounts for a specific authority
 * 3. Get a single stake account by address
 */

import { NosanaClient, NosanaNetwork } from '@nosana/kit';

async function main() {
  // Initialize the client
  const client = new NosanaClient(NosanaNetwork.MAINNET);

  console.log('=== Stake Program Example ===\n');

  try {
    // Example 1: Get all stake accounts
    console.log('1. Fetching all stake accounts...');
    const allStakes = await client.stake.all();
    console.log(`   Found ${allStakes.length} stake accounts`);

    if (allStakes.length > 0) {
      const firstStake = allStakes[0];
      console.log('   First stake account:');
      console.log(`   - Address: ${firstStake.address}`);
      console.log(`   - Authority: ${firstStake.authority}`);
      console.log(`   - Amount: ${firstStake.amount}`);
      console.log(`   - xNOS: ${firstStake.xnos}`);
      console.log(`   - Duration: ${firstStake.duration}`);
      console.log(`   - Time Unstake: ${firstStake.timeUnstake}`);
      console.log(`   - Vault: ${firstStake.vault}`);
      console.log(`   - Vault Bump: ${firstStake.vaultBump}`);
    }
    console.log();

    // Example 2: Get a single stake account (if you know a stake account address)
    if (allStakes.length > 0) {
      console.log('2. Fetching single stake account...');
      const stakeAddress = allStakes[0].address;
      const stake = await client.stake.get(stakeAddress);
      console.log(`   Retrieved stake account: ${stake.address}`);
      console.log(`   - Authority: ${stake.authority}`);
      console.log(`   - Staked Amount: ${stake.amount}`);
      console.log(`   - xNOS Tokens: ${stake.xnos}`);
      console.log();
    }

    // Example 3: Get multiple stake accounts by address
    if (allStakes.length >= 2) {
      console.log('3. Fetching multiple stake accounts...');
      const addresses = allStakes.slice(0, 2).map(s => s.address);
      const stakes = await client.stake.multiple(addresses);
      console.log(`   Retrieved ${stakes.length} stake accounts`);
      stakes.forEach((stake, i) => {
        console.log(`   Stake ${i + 1}:`);
        console.log(`   - Address: ${stake.address}`);
        console.log(`   - Authority: ${stake.authority}`);
        console.log(`   - Amount: ${stake.amount}`);
      });
      console.log();
    }

    // Example 4: Analyze staking distribution
    console.log('4. Analyzing staking distribution...');
    const totalStaked = allStakes.reduce((sum, stake) => sum + stake.amount, 0);
    const averageStake = allStakes.length > 0 ? totalStaked / allStakes.length : 0;
    const largestStake = allStakes.reduce((max, stake) =>
      stake.amount > max ? stake.amount : max, 0
    );

    console.log(`   Total staked: ${totalStaked}`);
    console.log(`   Average stake: ${averageStake.toFixed(2)}`);
    console.log(`   Largest stake: ${largestStake}`);
    console.log(`   Number of stakers: ${allStakes.length}`);

  } catch (error) {
    console.error('Error:', error);
  }
}

main();

