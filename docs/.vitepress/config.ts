import { defineConfig } from 'vitepress';
import { transformerTwoslash } from '@shikijs/vitepress-twoslash';
import { tabsMarkdownPlugin } from 'vitepress-plugin-tabs';
import { withMermaid } from 'vitepress-plugin-mermaid';
import { markdownGlossaryPlugin } from 'vitepress-plugin-glossary';
import chartPlugin from './plugins/chart';
import glossary from './glossary.json';

// Generate API sidebar from TypeDoc output organized by package groups
function getApiSidebar() {
  // Define package groups in the order we want them displayed
  const packageGroups = [
    { title: '@nosana/kit', anchor: 'nosana-kit' },
    { title: '@nosana/authorization', anchor: 'nosana-authorization' },
    { title: '@nosana/ipfs', anchor: 'nosana-ipfs' },
    { title: '@nosana/endpoints', anchor: 'nosana-endpoints' },
    { title: '@nosana/api', anchor: 'nosana-api' },
    { title: '@nosana/types', anchor: 'nosana-types' },
    { title: '@solana/kit', anchor: 'solana-kit' },
  ];

  return [
    {
      text: 'SDK Reference',
      items: [
        { text: 'Overview', link: '/api/' },
        ...packageGroups.map((pkg) => ({
          text: pkg.title,
          link: `/api/#${pkg.anchor}`,
        })),
      ],
    },
  ];
}

export default withMermaid(
  defineConfig({
    title: 'Nosana Docs',
    description: 'Complete documentation for the Nosana Network - SDK, protocols, and guides',
    base: '/',
    themeConfig: {
      nav: [
        {
          text: 'Kit',
          items: [
            { text: 'Guide', link: '/guide/' },
            { text: 'Examples', link: '/examples/' },
            { text: 'SDK Reference', link: '/api/' },
          ],
        },
        { text: 'Jobs', link: '/jobs/' },
        { text: 'Host GPUs', link: '/hosts/grid' },
        { text: 'CLI', link: '/inference/quick_start' },
        { text: 'Wallet', link: '/wallet' },
        { text: 'Programs', link: '/programs/start' },
      ],

      sidebar: {
        '/guide/': [
          {
            text: 'Getting Started',
            items: [
              { text: 'Installation', link: '/guide/installation' },
              { text: 'Quick Start', link: '/guide/quick-start' },
              { text: 'Configuration', link: '/guide/configuration' },
            ],
          },
          {
            text: 'Core Concepts',
            items: [
              { text: 'Architecture', link: '/guide/architecture' },
              { text: 'Wallet Configuration', link: '/guide/wallet' },
              { text: 'Error Handling', link: '/guide/error-handling' },
            ],
          },
          {
            text: 'Programs',
            items: [
              { text: 'Jobs Program', link: '/guide/jobs-program' },
              { text: 'Staking Program', link: '/guide/staking-program' },
              { text: 'Merkle Distributor', link: '/guide/merkle-distributor' },
            ],
          },
          {
            text: 'Services',
            items: [
              { text: 'Solana Service', link: '/guide/solana-service' },
              { text: 'IPFS Service', link: '/guide/ipfs-service' },
              { text: 'Token Service', link: '/guide/token-service' },
              { text: 'API Service', link: '/guide/api-service' },
              { text: 'Authorization Service', link: '/guide/authorization-service' },
            ],
          },
        ],
        '/examples/': [
          {
            text: 'Examples',
            items: [
              { text: 'Basic Usage', link: '/examples/basic-usage' },
              { text: 'Jobs', link: '/examples/jobs' },
              { text: 'Staking', link: '/examples/staking' },
              { text: 'IPFS', link: '/examples/ipfs' },
              { text: 'Transactions', link: '/examples/transactions' },
              { text: 'Partial Signing', link: '/examples/partial-signing' },
            ],
          },
        ],
        '/api/': getApiSidebar(),
        '/hosts/': [
          {
            text: 'Host GPUs',
            items: [
              { text: 'Getting Started', link: '/hosts/grid' },
              { text: 'Ubuntu Setup', link: '/hosts/grid-ubuntu' },
              { text: 'Running the Host', link: '/hosts/grid-run' },
              { text: 'Troubleshooting', link: '/hosts/troubleshoot' },
            ],
          },
        ],
        '/jobs/': [
          {
            text: 'Jobs',
            items: [
              { text: 'Introduction', link: '/jobs/' },
              { text: 'Job Execution Flow', link: '/jobs/job_execution_flow' },
              {
                text: 'Job Definition',
                items: [
                  { text: 'Intro', link: '/jobs/job-definition/intro' },
                  { text: 'Schema', link: '/jobs/job-definition/schema' },
                  { text: 'Health Checks', link: '/jobs/job-definition/health-checks' },
                  { text: 'Literals (Pipeline)', link: '/jobs/job-definition/literals' },
                  {
                    text: 'Resources',
                    items: [
                      { text: 'Overview', link: '/jobs/job-definition/resources' },
                      { text: 'S3 Resources', link: '/jobs/job-definition/s3' },
                      { text: 'HuggingFace Resources', link: '/jobs/job-definition/huggingface' },
                      { text: 'Cached Resources', link: '/jobs/job-definition/cached-resources' },
                    ],
                  },
                  { text: 'Confidential Jobs', link: '/jobs/job-definition/confidential' },
                  { text: 'Services', link: '/jobs/job-definition/services' },
                ],
              },
            ],
          },
        ],
        '/inference/': [
          {
            text: 'Run Inference (CLI)',
            items: [
              { text: 'Quick Start', link: '/inference/quick_start' },
              { text: 'GPU Markets', link: '/inference/gpu-markets' },
              { text: 'Endpoints', link: '/inference/endpoints' },
              {
                text: 'Examples',
                items: [
                  { text: 'Examples Catalog', link: '/inference/examples/' },
                  { text: 'Hello World', link: '/inference/examples/hello_world' },
                  { text: 'Jupyter', link: '/inference/examples/jupyter' },
                  { text: 'Open WebUI', link: '/inference/examples/open_webui' },
                  { text: 'Stable Diffusion', link: '/inference/examples/stable' },
                  { text: 'Whisper', link: '/inference/examples/whisper' },
                  { text: 'Ollama', link: '/inference/examples/ollama' },
                  { text: 'TinyLlama', link: '/inference/examples/tinyllama' },
                  { text: 'Multi Job', link: '/inference/examples/multi_job' },
                  { text: 'vLLM', link: '/inference/examples/vllm' },
                  { text: 'LMDeploy', link: '/inference/examples/lmdeploy' },
                ],
              },
            ],
          },
        ],
        '/programs/': [
          {
            text: 'Programs',
            items: [
              { text: 'Getting Started', link: '/programs/start' },
              { text: 'Staking', link: '/programs/staking' },
              { text: 'Rewards', link: '/programs/rewards' },
              { text: 'Pools', link: '/programs/pools' },
              { text: 'Jobs', link: '/programs/jobs' },
              { text: 'Nodes', link: '/programs/nodes' },
              { text: 'Token', link: '/programs/token' },
            ],
          },
        ],
        '/wallet/': [
          {
            text: 'Wallet',
            items: [{ text: 'Wallet', link: '/wallet' }],
          },
        ],
      },

      socialLinks: [{ icon: 'github', link: 'https://github.com/nosana-ci/nosana-kit' }],

      search: {
        provider: 'local',
      },
    },

    markdown: {
      math: true,
      // Enhanced code block features
      lineNumbers: true,
      // Twoslash transformer for type hover information
      codeTransformers: [transformerTwoslash()],
      languages: ['ts', 'typescript', 'tsx', 'js', 'javascript', 'json', 'bash', 'shell'],
      // Tabs plugin for VuePress-style tabs syntax
      // Chart plugin for Chart.js charts
      // Glossary plugin for automatic term linking
      config(md) {
        md.use(tabsMarkdownPlugin);
        md.use(chartPlugin);
        md.use(markdownGlossaryPlugin, {
          glossary: glossary,
          firstOccurrenceOnly: false,
        });
      },
    },

    // Ensure VitePress serves .md files from the api directory
    srcExclude: ['**/node_modules/**', '**/.git/**'],
  })
);
