import { address, NosanaClient, NosanaNetwork } from '@nosana/kit';

async function main() {
  // Initialize the client with devnet for testing
  const client = new NosanaClient(NosanaNetwork.MAINNET);

  try {
    // Example: Get job details
    const jobAddress = 'BwBURHTRMM3Ckzo2Dzmw99hv6gV8Ve12b6iw4sm9qeyR'; // Replace with actual job address
    const jobDetails = await client.jobs.get(address(jobAddress));
    console.log('Job details:', jobDetails);

  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 