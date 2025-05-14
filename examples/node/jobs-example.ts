import { NosanaClient, NosanaNetwork } from '@nosana/kit';

async function main() {
  // Initialize the client with devnet for testing
  const client = new NosanaClient(NosanaNetwork.DEVNET);

  try {
    // Example: Get job details
    const jobAddress = '4RuHBKYz3n1crM1VZ7s7oYjA7xfFYHF4ySxkjYkBWXDV'; // Replace with actual job address
    const jobDetails = await client.jobs.get(jobAddress);
    console.log('Job details:', jobDetails);

  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 