#!/usr/bin/env node
// Validates the Claude Code plugin in packages/skills.
//
// The plugin ships no code, so nothing else in CI would catch a snippet that
// stopped compiling against @nosana/kit, a dead cross-reference, or a manifest
// that drifted from the skill it points at. Requires @nosana/kit to be built.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync } from 'node:fs';

// Resolved from this file, not cwd: pnpm runs package scripts from the package
// directory, so cwd is not the repo root when invoked as `skills run test`.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const PLUGIN = join(ROOT, 'packages/skills');
const SKILL_DIR = join(PLUGIN, 'skills/nosana');
const KIT_TYPES = join(ROOT, 'packages/kit/dist/index.d.ts');

const failures = [];
const fail = (msg) => failures.push(msg);
const ok = (msg) => console.log(`  ok   ${msg}`);

const mdFiles = () => [
  join(SKILL_DIR, 'SKILL.md'),
  ...readdirSync(join(SKILL_DIR, 'reference')).filter((f) => f.endsWith('.md')).map((f) => join(SKILL_DIR, 'reference', f)),
];

// --- manifests -------------------------------------------------------------
console.log('manifests');
const marketplace = JSON.parse(readFileSync(join(ROOT, '.claude-plugin/marketplace.json'), 'utf8'));
const plugin = JSON.parse(readFileSync(join(PLUGIN, '.claude-plugin/plugin.json'), 'utf8'));
const entry = marketplace.plugins?.[0];

if (entry?.name !== plugin.name) fail(`marketplace entry "${entry?.name}" != plugin.json "${plugin.name}"`);
else ok('marketplace entry and plugin.json names agree');

if (!existsSync(join(ROOT, entry.source))) fail(`marketplace source "${entry.source}" does not exist`);
else ok(`source ${entry.source} resolves`);

if (!existsSync(join(ROOT, entry.source, 'skills/nosana/SKILL.md'))) fail('SKILL.md not found under the plugin source');
else ok('SKILL.md present at the expected path');

// A version in plugin.json silently overrides the marketplace entry, and this
// plugin is outside the pnpm workspace so nothing bumps it automatically.
if ('version' in plugin) fail('plugin.json declares a version; it cannot be bumped automatically here');
else ok('plugin.json declares no version (tracks the repo)');

// --- frontmatter -----------------------------------------------------------
console.log('frontmatter');
const ALLOWED = new Set(['name', 'description', 'license', 'compatibility', 'metadata', 'allowed-tools']);
const skillText = readFileSync(join(SKILL_DIR, 'SKILL.md'), 'utf8');
if (!skillText.startsWith('---')) fail('SKILL.md has no frontmatter');
const fm = skillText.split('---')[1] ?? '';
const keys = [...fm.matchAll(/^([\w-]+):/gm)].map((m) => m[1]);
const bad = keys.filter((k) => !ALLOWED.has(k));
if (bad.length) fail(`frontmatter keys not in the Agent Skills spec: ${bad.join(', ')}`);
else ok(`frontmatter keys valid (${keys.join(', ')})`);

const name = fm.match(/^name: (.+)$/m)?.[1].trim();
if (name !== 'nosana') fail(`frontmatter name "${name}" != directory "nosana"`);
else ok('name matches the skill directory');

const desc = fm.match(/^description: (.+)$/m)?.[1] ?? '';
if (desc.length > 1536) fail(`description is ${desc.length} chars (cap 1536)`);
else ok(`description ${desc.length} chars`);

// --- links and containment -------------------------------------------------
console.log('links');
let linkCount = 0;
for (const f of mdFiles()) {
  const text = readFileSync(f, 'utf8');
  for (const m of text.matchAll(/\]\(([^)]+\.md)\)/g)) {
    const target = m[1];
    if (target.startsWith('http')) continue;
    linkCount++;
    if (!existsSync(join(dirname(f), target))) fail(`dead link in ${relative(ROOT, f)}: ${target}`);
  }
}
ok(`${linkCount} internal links resolve`);

// Review rejects plugins that reach outside their own directory.
for (const f of [...mdFiles(), join(PLUGIN, 'README.md')]) {
  const text = readFileSync(f, 'utf8');
  if (/\]\(\.\.\//.test(text)) fail(`${relative(ROOT, f)} links outside the plugin directory`);
}
ok('no references escape the plugin directory');

// --- fenced JSON -----------------------------------------------------------
console.log('json blocks');
let jsonCount = 0;
for (const f of mdFiles()) {
  const text = readFileSync(f, 'utf8');
  for (const m of text.matchAll(/```json\n([\s\S]*?)```/g)) {
    const block = m[1];
    if (block.trimStart().startsWith('"')) continue; // object fragment, not a document
    jsonCount++;
    try { JSON.parse(block); }
    catch (e) { fail(`invalid JSON in ${relative(ROOT, f)}: ${e.message}`); }
  }
}
ok(`${jsonCount} JSON blocks parse`);

// --- TypeScript snippets ---------------------------------------------------
console.log('typescript snippets');
if (!existsSync(KIT_TYPES)) {
  fail('packages/kit/dist/index.d.ts missing — build @nosana/kit before running this');
} else {
  const work = mkdtempSync(join(tmpdir(), 'skill-check-'));
  mkdirSync(join(work, 'src'), { recursive: true });

  // Context the docs assume but a fenced block cannot declare for itself.
  const DECLS = `
import type { JobDefinition } from '@nosana/kit';
type Deploy = Awaited<ReturnType<import('@nosana/kit').NosanaApi['deployments']['get']>>;
declare const process: { env: Record<string, string> };
declare const id: string; declare const jobAddress: string; declare const marketAddress: string;
declare const market: string; declare const nodeAddress: string; declare const token: string;
declare const url: string; declare const key: string;
declare const request: import('@nosana/kit').NosanaApiListJobRequest;
declare const jobs: { ipfsHash: string; market: string; timeout?: number }[];
declare const jobDefinition: JobDefinition; declare const jobDefinitionJson: unknown;
declare const newJobDefinition: JobDefinition; declare const input: unknown;
declare const deployment: Deploy; declare const api: import('@nosana/kit').NosanaApi;
declare const posted: { job: string; credits: { creditsUsed: number } };
declare const job: Awaited<ReturnType<Deploy['getJob']>>;
declare const ipfsHash: string; declare const e: unknown;
declare const object: Record<string, unknown>; declare const path: string; declare const cid: string;
`;
  // Blocks that document a frame's shape rather than executable code.
  const SHAPE_ONLY = [
    "{ type: 'deployment'",
    "{ type: 'job'",
    "{ type: 'event'",
    "{ type: 'task'",
    "{ type: 'endpoint'",
  ];

  let n = 0;
  const origins = [];
  for (const f of mdFiles()) {
    const text = readFileSync(f, 'utf8');
    for (const m of text.matchAll(/```ts\n([\s\S]*?)```/g)) {
      const code = m[1];
      if (SHAPE_ONLY.some((s) => code.trimStart().startsWith(s))) continue;
      const line = text.slice(0, m.index).split('\n').length;
      const lines = code.split('\n');
      const imports = lines.filter((l) => l.startsWith('import '));
      const body = lines.filter((l) => !l.startsWith('import '));
      let pre = '';
      if (!imports.some((l) => l.includes('NosanaClient'))) pre += "declare const client: import('@nosana/kit').NosanaClient;\n";
      if (!imports.some((l) => /\baddress\b/.test(l))) pre += 'declare const address: string;\n';
      n++;
      origins.push([`snip${n}`, `${relative(ROOT, f)}:${line}`]);
      writeFileSync(join(work, 'src', `snip${n}.ts`),
        `${imports.join('\n')}\n${DECLS}${pre}\nexport async function s${n}() {\n${body.join('\n')}\n}\n`);
    }
  }

  writeFileSync(join(work, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      target: 'ES2022', module: 'ESNext', moduleResolution: 'bundler',
      strict: true, noEmit: true, skipLibCheck: true, esModuleInterop: true,
      types: [], baseUrl: '.', paths: { '@nosana/kit': [KIT_TYPES] },
    },
    include: ['src/**/*.ts'],
  }, null, 2));

  try {
    execFileSync(join(ROOT, 'node_modules/.bin/tsc'), ['-p', join(work, 'tsconfig.json')], { stdio: 'pipe' });
    ok(`${n} snippets compile against @nosana/kit`);
  } catch (err) {
    const out = `${err.stdout ?? ''}${err.stderr ?? ''}`;
    for (const line of out.split('\n').filter(Boolean)) {
      const m = line.match(/src\/(snip\d+)\.ts/);
      const origin = m ? origins.find(([id]) => id === m[1])?.[1] : null;
      fail(origin ? `${origin} — ${line.replace(/^.*?:\s*/, '')}` : line);
    }
  }
  rmSync(work, { recursive: true, force: true });
}

// --- result ----------------------------------------------------------------
console.log();
if (failures.length) {
  console.error(`FAILED (${failures.length})`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('skill validation passed');
