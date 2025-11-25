/* eslint-disable no-console */
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { createFromRoot } from 'codama';
import { rootNodeFromAnchor, AnchorIdl } from '@codama/nodes-from-anchor';
import { renderVisitor as renderJavaScriptVisitor } from '@codama/renderers-js';

import { processEnumsInDirectory } from './utils/convert-typescript-enums-to-const.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function ensureDir(p: string) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

async function main() {
  // Load IDLs
  const idlDir = path.resolve(__dirname, '..', 'idl');
  const idlJobsPath = path.join(idlDir, 'nosana_jobs.json');
  const idlStakingPath = path.join(idlDir, 'nosana_stake.json');
  const idlMerkleDistributorPath = path.join(idlDir, 'merkle_distributor.json');

  if (!existsSync(idlJobsPath)) {
    throw new Error(`IDL file not found: ${idlJobsPath}`);
  }
  if (!existsSync(idlStakingPath)) {
    throw new Error(`IDL file not found: ${idlStakingPath}`);
  }
  if (!existsSync(idlMerkleDistributorPath)) {
    throw new Error(`IDL file not found: ${idlMerkleDistributorPath}`);
  }

  const anchorJobsIdl = JSON.parse(readFileSync(idlJobsPath, 'utf-8'));
  const anchorStakingIdl = JSON.parse(readFileSync(idlStakingPath, 'utf-8'));
  const merkleDistributorIdl = JSON.parse(
    readFileSync(idlMerkleDistributorPath, 'utf-8')
  );

  // Generate clients
  const codamaJobs = createFromRoot(rootNodeFromAnchor(anchorJobsIdl as AnchorIdl));

  const jobsPath = path.join(__dirname, '..', 'src', 'generated_clients', 'jobs');
  ensureDir(jobsPath);
  codamaJobs.accept(renderJavaScriptVisitor(jobsPath));
  console.log('Processing enums in jobs...');
  // Small delay to ensure files are written
  await new Promise((resolve) => setTimeout(resolve, 100));
  processEnumsInDirectory(jobsPath);

  const codamaStaking = createFromRoot(
    rootNodeFromAnchor(anchorStakingIdl as AnchorIdl)
  );

  const stakingPath = path.join(
    __dirname,
    '..',
    'src',
    'generated_clients',
    'staking'
  );
  ensureDir(stakingPath);
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
  ensureDir(merkleDistributorPath);
  codamaMerkleDistributor.accept(renderJavaScriptVisitor(merkleDistributorPath));
  console.log('Processing enums in merkle_distributor...');
  await new Promise((resolve) => setTimeout(resolve, 100));
  processEnumsInDirectory(merkleDistributorPath);

  console.log('✅ Client generation and enum conversion complete!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
