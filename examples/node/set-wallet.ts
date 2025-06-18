import { NosanaClient, NosanaNetwork } from '@nosana/kit';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('🚀 Nosana Client setWallet Examples\n');

  // Initialize the client
  const client = new NosanaClient(NosanaNetwork.DEVNET);

  // Example 1: Set wallet from file path
  console.log('1. Setting wallet from file path...');
  try {
    const keypairPath = path.join(__dirname, 'example-keypair.json');

    const wallet1 = await client.setWallet(keypairPath);
    console.log('✅ Wallet set from file path successfully');
    console.log('   Address:', wallet1?.address);
  } catch (error) {
    console.error('❌ Error setting wallet from file:', error);
  }

  // Example 2: Set wallet from JSON array string
  console.log('\n2. Setting wallet from JSON array string...');
  try {
    const jsonArrayString = '[66,240,117,68,169,30,179,62,57,123,28,249,122,218,186,173,196,222,208,58,126,168,32,91,126,64,102,33,220,51,49,97,6,197,228,206,210,117,23,184,89,48,217,110,194,137,242,129,112,23,140,120,148,249,210,18,105,192,40,197,250,132,40,149]';
    const wallet2 = await client.setWallet(jsonArrayString);
    console.log('✅ Wallet set from JSON array string successfully');
    console.log('   Address:', wallet2?.address);
  } catch (error) {
    console.error('❌ Error setting wallet from JSON array string:', error);
  }

  // Example 3: Set wallet from number array
  console.log('\n3. Setting wallet from number array...');
  try {
    const numberArray = [66, 240, 117, 68, 169, 30, 179, 62, 57, 123, 28, 249, 122, 218, 186, 173, 196, 222, 208, 58, 126, 168, 32, 91, 126, 64, 102, 33, 220, 51, 49, 97, 6, 197, 228, 206, 210, 117, 23, 184, 89, 48, 217, 110, 194, 137, 242, 129, 112, 23, 140, 120, 148, 249, 210, 18, 105, 192, 40, 197, 250, 132, 40, 149];
    const wallet3 = await client.setWallet(numberArray);
    console.log('✅ Wallet set from number array successfully');
    console.log('   Address:', wallet3?.address);
  } catch (error) {
    console.error('❌ Error setting wallet from number array:', error);
  }

  // Example 4: Set wallet from base58 string
  console.log('\n4. Setting wallet from base58 string...');
  try {
    // This is the base58 encoded version of the same keypair
    const base58String = '2Ld9Q8E9TxsSPf9Zkxn55u2EuuXBZUiV3XJf1duTnKmH1GgEfhW4tYoTRh5GKMWSd8j853YrtJMN74hixjLsnkRJ';
    const wallet4 = await client.setWallet(base58String);
    console.log('✅ Wallet set from base58 string successfully');
    console.log('   Address:', wallet4?.address);
  } catch (error) {
    console.error('❌ Error setting wallet from base58 string:', error);
  }

  // Example 5: Set wallet from environment variable
  console.log('\n5. Setting wallet from environment variable...');
  try {
    // Set an environment variable with the keypair
    process.env.EXAMPLE_WALLET_KEY = '[66,240,117,68,169,30,179,62,57,123,28,249,122,218,186,173,196,222,208,58,126,168,32,91,126,64,102,33,220,51,49,97,6,197,228,206,210,117,23,184,89,48,217,110,194,137,242,129,112,23,140,120,148,249,210,18,105,192,40,197,250,132,40,149]';

    const wallet5 = await client.setWallet('EXAMPLE_WALLET_KEY');
    console.log('✅ Wallet set from environment variable successfully');
    console.log('   Address:', wallet5?.address);

    // Clean up
    delete process.env.EXAMPLE_WALLET_KEY;
  } catch (error) {
    console.error('❌ Error setting wallet from environment variable:', error);
  }

  // Example 6: Demonstrate error handling
  console.log('\n6. Demonstrating error handling...');
  try {
    await client.setWallet('invalid-wallet-data');
  } catch (error) {
    console.log('✅ Error handling works correctly:', error instanceof Error ? error.message : error);
  }

  console.log('\n🎉 All setWallet examples completed!');
}

main().catch(console.error);