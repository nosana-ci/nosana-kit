#!/usr/bin/env bash
set -euo pipefail

mkdir -p /data/ledger

FIXTURES_DIR="${FIXTURES_DIR:-/data/fixtures}"
RPC_PORT="${RPC_PORT:-8899}"
GOSSIP_PORT="${GOSSIP_PORT:-8001}"
DYNAMIC_PORT_RANGE="${DYNAMIC_PORT_RANGE:-8002-8020}"

args=(
  --reset
  --ledger /data/ledger
  --rpc-port "${RPC_PORT}"
  --gossip-port "${GOSSIP_PORT}"
  --dynamic-port-range "${DYNAMIC_PORT_RANGE}"
  --bind-address 0.0.0.0
)

# Load programs from pre-baked .so ELF files
for so_file in "${FIXTURES_DIR}"/*.so; do
  [[ -f "${so_file}" ]] || continue
  program_id="$(basename "${so_file}" .so)"
  echo "Loading program: ${program_id}"
  args+=(--bpf-program "${program_id}" "${so_file}")
done

# Load account fixtures from JSON files
for fixture in "${FIXTURES_DIR}"/*.json; do
  [[ -f "${fixture}" ]] || continue
  addr="$(basename "${fixture}" .json)"
  echo "Loading account: ${addr}"
  args+=(--account "${addr}" "${fixture}")
done

# Optional: clone additional programs/accounts at runtime
needs_url=0

if [[ -n "${CLONE_UPGRADEABLE_PROGRAMS:-}" ]]; then
  needs_url=1
  IFS=',' read -r -a program_ids <<< "${CLONE_UPGRADEABLE_PROGRAMS}"
  for program_id in "${program_ids[@]}"; do
    if [[ -n "${program_id}" ]]; then
      args+=(--clone-upgradeable-program "${program_id}")
    fi
  done
fi

if [[ -n "${CLONE_ACCOUNTS:-}" ]]; then
  needs_url=1
  IFS=',' read -r -a account_ids <<< "${CLONE_ACCOUNTS}"
  for account_id in "${account_ids[@]}"; do
    if [[ -n "${account_id}" ]]; then
      args+=(--clone "${account_id}")
    fi
  done
fi

if [[ "${needs_url}" == "1" ]]; then
  SOURCE_CLUSTER_URL="${SOURCE_CLUSTER_URL:-https://api.devnet.solana.com}"
  args+=(--url "${SOURCE_CLUSTER_URL}")
fi

echo "Starting solana-test-validator with args: ${args[*]}"
exec solana-test-validator "${args[@]}"
