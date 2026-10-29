import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, rmSync, statSync, utimesSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createFileSystemTypesCache } from '@shikijs/vitepress-twoslash/cache-fs';
import type { TwoslashTypesCache } from '@shikijs/twoslash';

const docsRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packagesRoot = resolve(docsRoot, '../packages');
const cacheRoot = resolve(docsRoot, '.vitepress/cache/twoslash');
/** Type surfaces kept: enough for the branches in flight, at ~1 MB each. */
const KEPT_TYPE_SURFACES = 8;

/**
 * Twoslash type-checks every sample against the kit, which is most of the
 * docs build's time and memory. Its file-system cache keys a result by the
 * sample's text alone, so it would hand back stale hovers, and miss new type
 * errors, after the kit's types change: this scopes the cache to a directory
 * named by a hash of every declaration file a sample can see, plus the
 * lockfile for the versions of @solana/kit, shiki and twoslash. A kit change
 * means a new directory and a cold cache, as it must; the samples alone
 * changing, or nothing changing (a release tag), means a hit. The most
 * recent few directories are kept, so the cache CI passes between branches
 * holds each branch's type surface rather than only the last one built.
 */
export function typeScopedTwoslashCache(): TwoslashTypesCache {
  const hash = createHash('sha256');
  hash.update(readFileSync(resolve(docsRoot, '../pnpm-lock.yaml')));
  for (const file of declarationFiles(packagesRoot)) {
    hash.update(file.slice(packagesRoot.length));
    hash.update(readFileSync(file));
  }
  const dir = join(cacheRoot, hash.digest('hex').slice(0, 16));

  const cache = createFileSystemTypesCache({ dir });
  const counts = { hits: 0, misses: 0 };
  process.on('exit', () => {
    if (counts.hits + counts.misses)
      console.log(`twoslash cache: ${counts.hits} hits, ${counts.misses} misses (${dir})`);
  });
  return {
    ...cache,
    read(code) {
      const result = cache.read(code);
      counts[result ? 'hits' : 'misses']++;
      return result;
    },
    init() {
      cache.init?.();
      utimesSync(dir, new Date(), new Date());
      const surfaces = readdirSync(cacheRoot)
        .map((entry) => join(cacheRoot, entry))
        .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
      for (const stale of surfaces.slice(KEPT_TYPE_SURFACES))
        rmSync(stale, { recursive: true, force: true });
    },
  };
}

/** Every built `.d.ts` under the workspace packages, in a stable order. */
function declarationFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name)
  )) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') files.push(...declarationFiles(path));
    } else if (entry.name.endsWith('.d.ts')) {
      files.push(path);
    }
  }
  return files;
}
