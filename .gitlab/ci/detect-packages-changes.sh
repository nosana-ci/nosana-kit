#!/usr/bin/env bash
set -euo pipefail

tmp_dir=$(mktemp -d)
cleanup() {
  rm -rf "$tmp_dir"
}
trap cleanup EXIT

workspace_json="$tmp_dir/workspace.json"
changed_json="$tmp_dir/changed.json"

pnpm -r ls --json --depth=-1 > "$workspace_json"

# Choose compare ref: tag pipeline -> previous tag; main branch -> previous commit; MR/other -> default branch
if [ -n "${CI_COMMIT_TAG:-}" ]; then
  # Compare with previous release tag (v*), so we see what changed in this release
  previous_tag=$(git tag -l 'v*' --sort=-version:refname 2>/dev/null | sed -n '2p')
  if [ -n "$previous_tag" ]; then
    compare_ref="$previous_tag"
  else
    compare_ref="origin/${CI_DEFAULT_BRANCH}"
  fi
elif [ "${CI_COMMIT_BRANCH:-}" = "${CI_DEFAULT_BRANCH:-}" ] && [ -n "${CI_COMMIT_BEFORE_SHA:-}" ] && [ "${CI_COMMIT_BEFORE_SHA}" != "0000000000000000000000000000000000000000" ]; then
  compare_ref="${CI_COMMIT_BEFORE_SHA}"
else
  compare_ref="origin/${CI_DEFAULT_BRANCH}"
fi

pnpm --filter "...[${compare_ref}]" list --depth -1 --json > "$changed_json"

WORKSPACE_JSON="$workspace_json" CHANGED_JSON="$changed_json" node <<'NODE'
const fs = require('fs');
const path = require('path');

const workspace = JSON.parse(
  fs.readFileSync(process.env.WORKSPACE_JSON, 'utf8'),
);
const changed = new Set(
  JSON.parse(fs.readFileSync(process.env.CHANGED_JSON, 'utf8')).map(
    pkg => pkg.name,
  ),
);

const variablesLines = [];
const changesEnvLines = [];

const toKey = pkgPath => {
  const base = path.basename(pkgPath);
  return base.replace(/[^A-Za-z0-9]/g, '_').toUpperCase();
};

const toSafeName = rel => rel.replace(/\//g, '-');

for (const pkg of workspace) {
  const pkgPath = pkg.path || pkg.dir || pkg.location || pkg.directory;
  const name = pkg.name;
  if (!pkgPath || !name) continue;

  const rel = path.relative(process.cwd(), pkgPath).replace(/\\/g, '/');
  const key = toKey(rel);
  const isChanged = changed.has(name) ? 1 : 0;

  variablesLines.push(`  ${key}_CHANGED: "${isChanged}"`);
  changesEnvLines.push(`${key}_CHANGED=${isChanged}`);
}

// ANY_CHANGED only when at least one changed package has a child pipeline (.gitlab-ci.yml) to trigger
// (computed in the trigger-jobs loop below)

// Orchestrator: trigger jobs use local: path to each package's .gitlab-ci.yml (no artifacts).
const triggerJobs = [];
let anyChanged = 0;
for (const pkg of workspace) {
  const pkgPath = pkg.path || pkg.dir || pkg.location || pkg.directory;
  const name = pkg.name;
  if (!pkgPath || !name) continue;

  const rel = path.relative(process.cwd(), pkgPath).replace(/\\/g, '/');
  const ciPath = `${rel}/.gitlab-ci.yml`;
  if (!fs.existsSync(ciPath)) continue;

  const isChanged = changed.has(name);
  if (isChanged) anyChanged = 1;

  const key = toKey(rel);
  const safeName = toSafeName(rel);
  const jobName = `trigger_${safeName.replace(/-/g, '_')}`;
  triggerJobs.push(`
${jobName}:
  stage: trigger
  trigger:
    include:
      - local: ${ciPath}
    strategy: depend
  rules:
    - if: $${key}_CHANGED == "1"
`);
}
variablesLines.push(`  ANY_CHANGED: "${anyChanged}"`);
changesEnvLines.push(`ANY_CHANGED=${anyChanged}`);

fs.writeFileSync('changes.env', changesEnvLines.join('\n') + '\n');

const variablesBlock = variablesLines.join('\n');

let orchestratorTemplate = fs.readFileSync('.gitlab/ci/orchestrator-template.yml', 'utf8');
orchestratorTemplate = orchestratorTemplate
  .replace('__VARIABLES_BLOCK__', variablesBlock)
  .replace('__TRIGGER_JOBS_BLOCK__', triggerJobs.join('').trimStart());
fs.writeFileSync('orchestrator.yml', orchestratorTemplate);
NODE

