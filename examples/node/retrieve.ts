import { address, NosanaClient, NosanaNetwork } from '@nosana/kit';

async function main() {
  // Initialize the client with devnet for testing
  const client = new NosanaClient(NosanaNetwork.DEVNET);

  try {
    // Example: Get job details
    const jobAddress = 'FMbwxyhhAwXzixRqoSFhYzbx6RAQE4kgoTCdHXkNQ6AR'; // Replace with actual job address
    const jobDetails = await client.jobs.get(address(jobAddress));
    console.log('Job details:', jobDetails);

  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 