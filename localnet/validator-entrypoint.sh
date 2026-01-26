#!/usr/bin/env bash
set -euo pipefail

mkdir -p /data/ledger

SOURCE_CLUSTER_URL="${SOURCE_CLUSTER_URL:-https://api.devnet.solana.com}"
RPC_PORT="${RPC_PORT:-8899}"
GOSSIP_PORT="${GOSSIP_PORT:-8001}"
DYNAMIC_PORT_RANGE="${DYNAMIC_PORT_RANGE:-8002-8020}"
LOCALNET_PREFLIGHT="${LOCALNET_PREFLIGHT:-1}"

args=(
  --reset
  --ledger /data/ledger
  --rpc-port "${RPC_PORT}"
  --gossip-port "${GOSSIP_PORT}"
  --dynamic-port-range "${DYNAMIC_PORT_RANGE}"
  --bind-address 0.0.0.0
)

needs_url=0

echo "Using SOURCE_CLUSTER_URL=${SOURCE_CLUSTER_URL}"
echo "CLONE_UPGRADEABLE_PROGRAMS=${CLONE_UPGRADEABLE_PROGRAMS:-}"
echo "CLONE_ACCOUNTS=${CLONE_ACCOUNTS:-}"

if [[ -n "${CLONE_UPGRADEABLE_PROGRAMS:-}" ]]; then
  needs_url=1
  IFS=',' read -r -a program_ids <<< "${CLONE_UPGRADEABLE_PROGRAMS}"
  if [[ "${LOCALNET_PREFLIGHT}" == "1" ]]; then
    echo "Preflight: verifying cloneable programs on ${SOURCE_CLUSTER_URL}"
    for program_id in "${program_ids[@]}"; do
      if [[ -n "${program_id}" ]]; then
        solana account "${program_id}" --url "${SOURCE_CLUSTER_URL}" >/dev/null
      fi
    done
  fi
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
  args+=(--url "${SOURCE_CLUSTER_URL}")
fi

echo "Starting solana-test-validator with args: ${args[*]}"
exec solana-test-validator "${args[@]}"

