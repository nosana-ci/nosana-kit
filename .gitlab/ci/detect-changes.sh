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

if [ "${CI_COMMIT_BRANCH:-}" = "${CI_DEFAULT_BRANCH:-}" ] && [ -n "${CI_COMMIT_BEFORE_SHA:-}" ] && [ "${CI_COMMIT_BEFORE_SHA}" != "0000000000000000000000000000000000000000" ]; then
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

const includeLines = [];
const variablesLines = [];
const changesEnvLines = [];
let anyChanged = 0;

const toKey = pkgPath => {
  const base = path.basename(pkgPath);
  return base.replace(/[^A-Za-z0-9]/g, '_').toUpperCase();
};

for (const pkg of workspace) {
  const pkgPath = pkg.path || pkg.dir || pkg.location || pkg.directory;
  const name = pkg.name;
  if (!pkgPath || !name) continue;

  const rel = path.relative(process.cwd(), pkgPath).replace(/\\/g, '/');
  const ciPath = `${rel}/.gitlab-ci.yml`;
  const key = toKey(rel);
  const isChanged = changed.has(name) ? 1 : 0;

  variablesLines.push(`  ${key}_CHANGED: "${isChanged}"`);
  changesEnvLines.push(`${key}_CHANGED=${isChanged}`);
  if (isChanged) {
    anyChanged = 1;
    if (fs.existsSync(ciPath)) {
      includeLines.push(`  - local: ${ciPath}`);
    }
  }
}

variablesLines.push(`  ANY_CHANGED: "${anyChanged}"`);
changesEnvLines.push(`ANY_CHANGED=${anyChanged}`);

fs.writeFileSync('changes.env', changesEnvLines.join('\n') + '\n');

let template = fs.readFileSync('.gitlab/ci/child-template.yml', 'utf8');
template = template
  .replace('__VARIABLES_BLOCK__', variablesLines.join('\n'))
  .replace('__INCLUDE_BLOCK__', includeLines.join('\n'));

fs.writeFileSync('child.yml', template);
NODE

