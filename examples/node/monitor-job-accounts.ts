import { NosanaClient, NosanaNetwork } from '@nosana/kit';

async function main() {
  // Initialize the Nosana client
  const client = new NosanaClient(NosanaNetwork.DEVNET);

  console.log('Starting job account monitoring...');

  try {
    // Start monitoring job account updates with hybrid approach
    const stopMonitoring = await client.jobs.monitorAccountUpdates({
      outputFile: 'job_accounts.json',
      useSubscriptions: true, // Try WebSocket subscriptions first
    });

    console.log('Job account monitoring started successfully!');
    console.log('Monitoring will save account updates to job_accounts.json');
    console.log('Press Ctrl+C to stop monitoring...');

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\nStopping job account monitoring...');
      stopMonitoring();
      console.log('Monitoring stopped. Exiting...');
      process.exit(0);
    });

    // Keep the process running
    await new Promise(() => { });

  } catch (error) {
    console.error('Failed to start job account monitoring:', error);
    process.exit(1);
  }
}

// Run the example
main().catch(console.error); 