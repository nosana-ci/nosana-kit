import { writeFileSync } from 'node:fs';
import path from 'node:path';

import type { SiteConfig } from 'vitepress';

const HOSTNAME = 'https://docs.nosana.com';

type SidebarItem = {
  text?: string;
  link?: string;
  items?: SidebarItem[];
};

type Entry = { text: string; link: string };

/**
 * Collects every internal link a sidebar declares, depth-first, so the order
 * matches the reading order a person sees. External links are skipped: an
 * llms.txt is an index of this site.
 */
function collect(items: readonly SidebarItem[], into: Entry[] = []): Entry[] {
  for (const item of items) {
    if (item.link && item.text && !/^https?:\/\//.test(item.link)) {
      into.push({ text: item.text, link: item.link });
    }
    if (item.items) collect(item.items, into);
  }
  return into;
}

/** Words a naive title-case would mangle into "Api" or "Sdk". */
const ACRONYMS: Record<string, string> = {
  api: 'API',
  sdk: 'SDK',
  cli: 'CLI',
  gpu: 'GPU',
  ipfs: 'IPFS',
  kit: 'Kit',
};

/** Title-cases a sidebar key (`/deployments/` -> `Deployments`, `/api/` -> `API`). */
function sectionName(key: string): string {
  const slug = key.replace(/^\/|\/$/g, '') || 'root';
  return slug
    .split(/[-/]/)
    .map((part) => ACRONYMS[part] ?? part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * Writes `llms.txt` into the build output: a navigation index of the docs for
 * AI readers, generated from the sidebar so it cannot drift from the nav a
 * person sees. Ora's `llms-txt-formatting` check wants a heading, markdown
 * links and under 30,000 characters, so the index links pages rather than
 * inlining them.
 */
export function writeLlmsTxt(config: SiteConfig): void {
  const theme = (config.site.themeConfig ?? {}) as {
    nav?: SidebarItem[];
    sidebar?: Record<string, SidebarItem[]> | SidebarItem[];
  };

  const lines: string[] = [
    `# ${config.site.title}`,
    '',
    config.site.description,
    '',
    'Nosana is an open-source GPU cloud: you rent GPU capacity on demand from a',
    'distributed network, or contribute idle GPUs and earn for running other',
    "people's workloads. These are the developer docs.",
    '',
    '## When to use these docs',
    '',
    '- **Deploying a GPU workload** — start at [Deployments](https://docs.nosana.com/deployments/intro).',
    '  A deployment runs one or more replicas of a container on a GPU market and',
    '  keeps them running.',
    '- **Calling the API directly** — start at [API](https://docs.nosana.com/api/intro).',
    '  Every endpoint is described by an OpenAPI document at',
    '  <https://api.nosana.com/api/openapi.json>.',
    '- **Writing TypeScript** — use [@nosana/kit](https://docs.nosana.com/kit/), the',
    '  typed SDK, rather than hand-rolling HTTP calls.',
    '- **Getting credentials** — see',
    '  [Get an API key](https://docs.nosana.com/api/get-api-key) and',
    '  <https://nosana.com/auth.md>.',
    '- **Hosting GPUs** — see [Host GPUs](https://docs.nosana.com/hosts/grid).',
    '',
    'Prices are per-second and set per GPU market. The live source is',
    '`GET https://api.nosana.com/api/markets/`, which needs no authentication.',
    '',
  ];

  const nav = theme.nav ? collect(theme.nav) : [];
  if (nav.length) {
    lines.push('## Sections', '');
    for (const { text, link } of nav) lines.push(`- [${text}](${HOSTNAME}${link})`);
    lines.push('');
  }

  const sidebar = theme.sidebar;
  const groups: Array<[string, SidebarItem[]]> = Array.isArray(sidebar)
    ? [['/', sidebar]]
    : Object.entries(sidebar ?? {});

  const seen = new Set(nav.map((entry) => entry.link));
  for (const [key, items] of groups) {
    const entries = collect(items).filter((entry) => {
      if (seen.has(entry.link)) return false;
      seen.add(entry.link);
      return true;
    });
    if (!entries.length) continue;
    lines.push(`## ${sectionName(key)}`, '');
    for (const { text, link } of entries) lines.push(`- [${text}](${HOSTNAME}${link})`);
    lines.push('');
  }

  lines.push(
    '## Elsewhere',
    '',
    '- [nosana.com](https://nosana.com/) and its [llms.txt](https://nosana.com/llms.txt)',
    '- [OpenAPI document](https://api.nosana.com/api/openapi.json)',
    '- [nosana-kit on GitHub](https://github.com/nosana-ci/nosana-kit)',
    '',
  );

  const out = `${lines.join('\n')}`;
  writeFileSync(path.join(config.outDir, 'llms.txt'), out, 'utf-8');
  // eslint-disable-next-line no-console
  console.log(`[llms.txt] wrote ${out.length} characters to ${config.outDir}/llms.txt`);
}
