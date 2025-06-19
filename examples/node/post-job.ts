import { NosanaClient, NosanaNetwork } from '@nosana/kit';
import path from 'path';

async function main() {
  console.log('🚀 Nosana Job Posting Example');
  console.log('===============================\n');

  try {
    // Initialize the client
    console.log('📡 Initializing Nosana client...');
    const client = new NosanaClient(NosanaNetwork.DEVNET);

    // Set up the wallet using the example keypair
    const keypairPath = path.join(__dirname, 'example-keypair.json');
    console.log('🔑 Setting up wallet from:', keypairPath);

    const wallet = await client.setWallet(keypairPath);
    console.log('✅ Wallet address:', wallet?.address);

    // Get available markets
    console.log('\n📊 Fetching available markets...');
    const markets = await client.jobs.markets();

    if (markets.length === 0) {
      throw new Error('No markets available. Please check your network connection and try again.');
    }

    console.log(`✅ Found ${markets.length} market(s)`);
    const market = markets[0]; // Use the first available market
    console.log(`📈 Using market: ${market.address}`);

    // Example job configuration
    const jobConfig = {
      // Market to post the job to
      market: market.address,

      // Job timeout in seconds (1 hour)
      timeout: 3600,

      // IPFS hash of the job specification
      // In a real scenario, you would upload your job specification to IPFS first
      ipfsHash: 'QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N', // Example IPFS hash

      // Optional: specify a particular node (leave undefined for open market)
      // node: 'NodeAddressHere'
    };

    console.log('\n📝 Job Configuration:');
    console.log('   Market:', jobConfig.market.toString());
    console.log('   Timeout:', jobConfig.timeout, 'seconds');
    console.log('   IPFS Hash:', jobConfig.ipfsHash);

    // Step 1: Create the job listing instruction
    console.log('\n🔧 Creating job listing instruction...');
    const instruction = await client.jobs.post(jobConfig);
    console.log('✅ Instruction created successfully');
    console.log('   Program Address:', instruction.programAddress);
    console.log('   Accounts:', instruction.accounts.length);

    // Step 2: Send the instruction using the send utility
    console.log('\n📤 Sending job listing transaction...');
    const signature = await client.solana.send(instruction);
    console.log('✅ Transaction sent successfully!');
    console.log('   Transaction Signature:', signature);

    // You can view the transaction on Solana Explorer
    const explorerUrl = `https://explorer.solana.com/tx/${signature}?cluster=${client.config.solana.cluster}`;
    console.log('   View on Explorer:', explorerUrl);

    console.log('\n🎉 Job posted successfully!');
    console.log('💡 Your job is now listed on the Nosana network and waiting for nodes to pick it up.');

  } catch (error) {
    console.error('\n❌ Error posting job:', error);
    process.exit(1);
  }
}

// Advanced example showing multiple instructions in one transaction
async function advancedExample() {
  console.log('\n\n🔬 Advanced Example: Multiple Instructions');
  console.log('==========================================\n');

  try {
    const client = new NosanaClient(NosanaNetwork.DEVNET);
    const keypairPath = path.join(__dirname, 'example-keypair.json');
    await client.setWallet(keypairPath);

    const markets = await client.jobs.markets();
    if (markets.length === 0) {
      throw new Error('No markets available');
    }

    // Create multiple job instructions
    const instructions = [];

    for (let i = 0; i < 2; i++) {
      const jobConfig = {
        market: markets[0].address,
        timeout: 3600,
        ipfsHash: `QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx${i}N`, // Different IPFS hashes
      };

      console.log(`🔧 Creating job ${i + 1} instruction...`);
      const instruction = await client.jobs.post(jobConfig);
      instructions.push(instruction);
    }

    // Send all instructions in a single transaction
    console.log('\n📤 Sending batch transaction with multiple jobs...');
    const signature = await client.solana.send(instructions);
    console.log('✅ Batch transaction sent successfully!');
    console.log('   Transaction Signature:', signature);

    console.log('\n🎉 Multiple jobs posted in a single transaction!');

  } catch (error) {
    console.error('\n❌ Error in advanced example:', error);
  }
}

// Example of error handling
async function errorHandlingExample() {
  console.log('\n\n⚠️  Error Handling Example');
  console.log('==========================\n');

  try {
    const client = new NosanaClient(NosanaNetwork.DEVNET);

    // Try to post without setting a wallet (this will fail)
    console.log('🔧 Attempting to post job without wallet...');

    const jobConfig = {
      market: 'InvalidMarketAddress' as any,
      timeout: 3600,
      ipfsHash: 'QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N',
    };

    await client.jobs.post(jobConfig);

  } catch (error) {
    console.log('✅ Caught expected error:', error.message);
    console.log('💡 Always ensure your wallet is set before posting jobs!');
  }
}

// Run all examples
if (require.main === module) {
  main()
    .then(() => advancedExample())
    .then(() => errorHandlingExample())
    .then(() => {
      console.log('\n✨ All examples completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
} 