import { NosanaClient, NosanaNetwork } from '@nosana/kit';

async function main() {
  // Initialize the client with mainnet
  const client = new NosanaClient(NosanaNetwork.MAINNET);

  try {
    // Get the latest blockhash
    const blockhash = await client.solana.getLatestBlockhash();
    console.log('Latest blockhash:', blockhash);

    // Check balance of an address
    const address = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';
    const balance = await client.solana.getBalance(address);
    console.log('Balance:', balance, 'lamports');

  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 