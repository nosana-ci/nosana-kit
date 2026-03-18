#!/usr/bin/env bash
# prefetch.sh — Runs during `docker build` to download Nosana programs
# and accounts from devnet so they are baked into the image.
set -euo pipefail

SOURCE_CLUSTER_URL="${SOURCE_CLUSTER_URL:-https://api.devnet.solana.com}"
FIXTURES_DIR="${FIXTURES_DIR:-/data/fixtures}"

mkdir -p "${FIXTURES_DIR}"

# Nosana programs — dumped as raw ELF bytecode (.so)
PROGRAMS=(
  nosJTmGQxvwXy23vng5UjkTbfv91Bzf9jEuro78dAGR
  nosScmHY2uR24Zh751PmGj9ww9QRNHewh9H59AfrTJE
  nosRB8DUV67oLNrL45bo2pFLrmsWPiewe2Lk2DRNYCp
)

# Accounts to clone (rewards reflection + vault)
ACCOUNTS=(
  6tjbAfNHnUusWLZqFznMKyBrjs1ZX92eyKwiUi2Bsg3x
  4wk8dRGWQSCdRzvVJxu1jawHkV9pfzrEfUxYwYfwbXuk
)

echo "==> Prefetching Nosana programs and accounts from ${SOURCE_CLUSTER_URL}"

for program_id in "${PROGRAMS[@]}"; do
  echo "Dumping program: ${program_id}"
  solana program dump "${program_id}" "${FIXTURES_DIR}/${program_id}.so" \
    --url "${SOURCE_CLUSTER_URL}"
done

for account_id in "${ACCOUNTS[@]}"; do
  echo "Fetching account: ${account_id}"
  solana account "${account_id}" \
    --url "${SOURCE_CLUSTER_URL}" \
    --output json \
    --output-file "${FIXTURES_DIR}/${account_id}.json"
done

echo "==> Prefetch complete. Fixtures:"
ls -lh "${FIXTURES_DIR}"
