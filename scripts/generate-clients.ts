import path from 'path';
import { fileURLToPath } from 'url';
import { createFromRoot } from 'codama';
import { rootNodeFromAnchor, AnchorIdl } from '@codama/nodes-from-anchor';
import { renderVisitor as renderJavaScriptVisitor } from '@codama/renderers-js';

import { processEnumsInDirectory } from './utils/convert-typescript-enums-to-const.ts';

// IDL imports
import anchorJobsIdl from '../idl/nosana_jobs.json' with { type: 'json' };
import anchorStakingIdl from '../idl/nosana_stake.json' with { type: 'json' };
import merkleDistributorIdl from '../idl/merkle_distributor.json' with { type: 'json' };

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const codamaJobs = createFromRoot(rootNodeFromAnchor(anchorJobsIdl as AnchorIdl));

  const jobsPath = path.join(__dirname, '..', 'src', 'generated_clients', 'jobs');
  codamaJobs.accept(renderJavaScriptVisitor(jobsPath));
  console.log('Processing enums in jobs...');
  // Small delay to ensure files are written
  await new Promise((resolve) => setTimeout(resolve, 100));
  processEnumsInDirectory(jobsPath);

  const codamaStaking = createFromRoot(rootNodeFromAnchor(anchorStakingIdl as AnchorIdl));

  const stakingPath = path.join(__dirname, '..', 'src', 'generated_clients', 'staking');
  codamaStaking.accept(renderJavaScriptVisitor(stakingPath));
  console.log('Processing enums in staking...');
  await new Promise((resolve) => setTimeout(resolve, 100));
  processEnumsInDirectory(stakingPath);

  const codamaMerkleDistributor = createFromRoot(
    rootNodeFromAnchor(merkleDistributorIdl as AnchorIdl)
  );

  const merkleDistributorPath = path.join(
    __dirname,
    '..',
    'src',
    'generated_clients',
    'merkle_distributor'
  );
  codamaMerkleDistributor.accept(renderJavaScriptVisitor(merkleDistributorPath));
  console.log('Processing enums in merkle_distributor...');
  await new Promise((resolve) => setTimeout(resolve, 100));
  processEnumsInDirectory(merkleDistributorPath);

  console.log('✅ Client generation and enum conversion complete!');
}

main().catch(console.error);
