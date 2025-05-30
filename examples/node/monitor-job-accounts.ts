import { NosanaClient, NosanaNetwork } from '@nosana/kit';
import { promises as fs } from 'fs';
import { Account } from 'gill';
import * as programClient from '../../src/generated_clients/jobs/index.js';
import { Job, Market, Run } from '../../dist/programs/JobsProgram.js';

// Type for storing job accounts in a more readable format
type JobAccountData = {
  address: string;
  data: any;
  lastUpdated: string;
};

async function main() {
  // Initialize the Nosana client
  const client = new NosanaClient(NosanaNetwork.DEVNET);

  console.log('Starting job account monitoring...');

  // Storage for accounts
  const jobAccounts = new Map<string, JobAccountData>();
  const runAccounts = new Map<string, JobAccountData>();
  const marketAccounts = new Map<string, JobAccountData>();

  // Helper function to save accounts to file
  const saveAccountsToFile = async () => {
    const data = {
      jobAccounts: Object.fromEntries(jobAccounts),
      runAccounts: Object.fromEntries(runAccounts),
      marketAccounts: Object.fromEntries(marketAccounts),
      lastUpdated: new Date().toISOString(),
      totalAccounts: jobAccounts.size + runAccounts.size + marketAccounts.size
    };

    try {
      await fs.writeFile('job_accounts.json', JSON.stringify(data, null, 2));
      console.log(`💾 Saved ${data.totalAccounts} accounts to job_accounts.json`);
    } catch (error) {
      console.error('Failed to save accounts to file:', error);
    }
  };

  // Load existing accounts if file exists
  try {
    const existingData = await fs.readFile('job_accounts.json', 'utf-8');
    const parsed = JSON.parse(existingData);

    if (parsed.jobAccounts) {
      for (const [key, value] of Object.entries(parsed.jobAccounts)) {
        jobAccounts.set(key, value as JobAccountData);
      }
    }
    if (parsed.runAccounts) {
      for (const [key, value] of Object.entries(parsed.runAccounts)) {
        runAccounts.set(key, value as JobAccountData);
      }
    }
    if (parsed.marketAccounts) {
      for (const [key, value] of Object.entries(parsed.marketAccounts)) {
        marketAccounts.set(key, value as JobAccountData);
      }
    }

    console.log(`📂 Loaded existing accounts: ${jobAccounts.size} jobs, ${runAccounts.size} runs, ${marketAccounts.size} markets`);
  } catch (error) {
    console.log('📝 Starting with empty account storage (no existing file found)');
  }

  try {
    // Start monitoring job account updates with callback functions
    const stopMonitoring = await client.jobs.monitorAccountUpdates({
      onJobAccount: async (jobAccount: Account<Job>) => {
        const accountData: JobAccountData = {
          address: jobAccount.address.toString(),
          data: jobAccount.data,
          lastUpdated: new Date().toISOString()
        };

        jobAccounts.set(jobAccount.address.toString(), accountData);
        console.log(`🔄 Job account updated: ${jobAccount.address.toString()}`);

        // Save to file after each update
        await saveAccountsToFile();
      },

      onRunAccount: async (runAccount: Account<Run>) => {
        const accountData: JobAccountData = {
          address: runAccount.address.toString(),
          data: runAccount.data,
          lastUpdated: new Date().toISOString()
        };

        runAccounts.set(runAccount.address.toString(), accountData);
        console.log(`🏃 Run account updated: ${runAccount.address.toString()}`);

        // Save to file after each update
        await saveAccountsToFile();
      },

      onMarketAccount: async (marketAccount: Account<Market>) => {
        const accountData: JobAccountData = {
          address: marketAccount.address.toString(),
          data: marketAccount.data,
          lastUpdated: new Date().toISOString()
        };

        marketAccounts.set(marketAccount.address.toString(), accountData);
        console.log(`🏪 Market account updated: ${marketAccount.address.toString()}`);

        // Save to file after each update
        await saveAccountsToFile();
      },

      onError: async (error: Error, accountType?: string) => {
        console.error(`❌ Error processing ${accountType || 'unknown'} account:`, error.message);
      }
    });

    console.log('✅ Job account monitoring started successfully!');
    console.log('📊 Monitoring will save account updates to job_accounts.json');
    console.log('🔍 Watching for job, run, and market account updates...');
    console.log('⏹️  Press Ctrl+C to stop monitoring...');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Stopping job account monitoring...');
      stopMonitoring();

      // Final save
      await saveAccountsToFile();

      console.log('✅ Monitoring stopped. Final data saved. Exiting...');
      process.exit(0);
    });

    // Keep the process running
    await new Promise(() => { });

  } catch (error) {
    console.error('❌ Failed to start job account monitoring:', error);
    process.exit(1);
  }
}

// Run the example
main().catch(console.error); 