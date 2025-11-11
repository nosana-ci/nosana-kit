import { address, NosanaClient, NosanaNetwork } from '@nosana/kit';

async function main() {
  const client = new NosanaClient(NosanaNetwork.MAINNET);

  // Claimant address
  const claimant = address('51rbYj7v4oWN78Xmna7KFYYFRHSBrjxpSP2YrpWGsg3s');

  // Distributor address - replace with the actual distributor address you want to check
  const distributor = address('P8XkzD1FxrSpnD1mQsWTuuTu6aKzEAnkibcYDGGgnKH');

  console.log('Distributor address:', distributor);

  try {
    // Get claim status for the specific claimant and distributor
    const status = await client.merkleDistributor.getClaimStatusForDistributor(
      distributor,
      claimant
    );

    if (status) {
      console.log('Claim status:', status);
      console.log('  Address:', status.address);
      console.log('  Claimant:', status.claimant);
      console.log('  Distributor:', status.distributor);
      console.log('  Unlocked Amount:', status.unlockedAmount);
      console.log('  Locked Amount:', status.lockedAmount);
    } else {
      console.log('No claim status found for this claimant and distributor combination.');
    }
  } catch (error) {
    console.error('Error retrieving claim status:', error);
  }
}

main();

