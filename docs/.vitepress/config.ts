import { defineConfig } from 'vitepress';
import { transformerTwoslash } from '@shikijs/vitepress-twoslash';
import { tabsMarkdownPlugin } from 'vitepress-plugin-tabs';
import { withMermaid } from 'vitepress-plugin-mermaid';
import { markdownGlossaryPlugin } from 'vitepress-plugin-glossary';
import chartPlugin from './plugins/chart';
import glossary from './glossary.json';
import { writeLlmsTxt } from './llms';

// Generate SDK Reference sidebar - simplified to single link
function getSdkReferenceSidebar() {
  return [{ text: 'SDK Reference', link: '/kit/reference/' }];
}

export default withMermaid(
  defineConfig({
    title: 'Nosana Docs',
    description: 'Complete documentation for the Nosana Network - SDK, protocols, and guides',
    base: '/',

    sitemap: {
      hostname: 'https://docs.nosana.com',
    },

    // Emits llms.txt from the sidebar, so the index agents read stays in step
    // with the navigation people read.
    buildEnd: writeLlmsTxt,

    themeConfig: {
      siteTitle: false,
      nav: [
        { text: 'About', link: '/about/introduction' },
        { text: 'Deployments', link: '/deployments/intro' },
        { text: 'API', link: '/api/intro' },
        { text: 'SDK', link: '/kit/' },
        { text: 'CLI', link: '/inference/quick_start' },
        { text: 'Host GPUs', link: '/hosts/grid' },
        { text: 'Programs', link: '/programs/start' },
      ],

      sidebar: {
        '/deployments/': [
          {
            text: 'Deployments',
            items: [
              { text: 'Introduction', link: '/deployments/intro' },
              { text: 'Strategies', link: '/deployments/strategies' },
              { text: 'GPU Markets', link: '/deployments/gpu-markets' },
              { text: 'Options', link: '/deployments/options' },
            ],
          },
          {
            text: 'Guides',
            items: [
              { text: 'My First Deployment', link: '/deployments/my-first-deployment' },
              { text: 'Deploy DeepSeek Model', link: '/deployments/deploy-deepseek-model' },
            ],
          },
          {
            text: 'Jobs',
            items: [
              { text: 'Introduction', link: '/deployments/jobs/' },
              { text: 'Job Execution Flow', link: '/deployments/jobs/job_execution_flow' },
              {
                text: 'Job Definition',
                items: [
                  { text: 'Intro', link: '/deployments/jobs/job-definition/intro' },
                  { text: 'Schema', link: '/deployments/jobs/job-definition/schema' },
                  { text: 'Validation', link: '/deployments/jobs/job-definition/validation' },
                  { text: 'Health Checks', link: '/deployments/jobs/job-definition/health-checks' },
                  {
                    text: 'Literals (Pipeline)',
                    link: '/deployments/jobs/job-definition/literals',
                  },
                  {
                    text: 'Resources',
                    collapsed: true,
                    items: [
                      { text: 'Overview', link: '/deployments/jobs/job-definition/resources' },
                      { text: 'S3 Resources', link: '/deployments/jobs/job-definition/s3' },
                      {
                        text: 'HuggingFace Resources',
                        link: '/deployments/jobs/job-definition/huggingface',
                      },
                      {
                        text: 'Cached Resources',
                        link: '/deployments/jobs/job-definition/cached-resources',
                      },
                    ],
                  },
                  {
                    text: 'Confidential Jobs',
                    link: '/deployments/jobs/job-definition/confidential',
                  },
                  { text: 'Services', link: '/deployments/jobs/job-definition/services' },
                ],
              },
            ],
          },
        ],
        '/api/': [
          {
            text: 'Nosana API',
            items: [{ text: 'Introduction', link: '/api/intro' }],
          },
          {
            text: 'Guides',
            items: [
              { text: 'Get API Key', link: '/api/get-api-key' },
              { text: 'Your First Job', link: '/api/first-job' },
              { text: 'Wallet Authentication', link: '/api/wallet-authentication' },
            ],
          },
          {
            text: 'Deployments',
            items: [
              { text: 'Create Deployments', link: '/api/create-deployments' },
              { text: 'Manage Deployments', link: '/api/manage-deployments' },
              { text: 'Vault Management', link: '/api/vault-management' },
            ],
          },
          {
            text: 'API Reference',
            items: [
              { text: 'Overview', link: '/api/reference' },
              { text: 'Authentication & API Keys', link: '/api/auth' },
              { text: 'Jobs', link: '/api/jobs' },
              { text: 'Markets', link: '/api/markets' },
              { text: 'Credits', link: '/api/credits' },
              { text: 'Templates', link: '/api/templates' },
              { text: 'Hosts', link: '/api/hosts' },
              { text: 'Stats', link: '/api/stats' },
              { text: 'Payments', link: '/api/payments' },
              { text: 'Benchmarks', link: '/api/benchmarks' },
              { text: 'Raw Clients', link: '/api/raw-clients' },
            ],
          },
        ],
        '/about/': [
          {
            text: 'About',
            items: [
              { text: 'Introduction', link: '/about/introduction' },
              { text: 'Getting Started', link: '/about/getting-started' },
              { text: 'Key Concepts', link: '/about/key-concepts' },
              { text: 'Solana Wallets', link: '/about/wallet' },
              { text: 'Glossary', link: '/about/glossary' },
            ],
          },
        ],
        '/kit/': [
          {
            text: 'Getting Started',
            items: [
              { text: 'Overview', link: '/kit/' },
              { text: 'Installation', link: '/kit/installation' },
              { text: 'Quick Start', link: '/kit/quick-start' },
              { text: 'Configuration', link: '/kit/configuration' },
            ],
          },
          {
            text: 'Core Concepts',
            items: [
              { text: 'Architecture', link: '/kit/architecture' },
              { text: 'Wallet Configuration', link: '/kit/wallet' },
              { text: 'Error Handling', link: '/kit/error-handling' },
            ],
          },
          {
            text: 'Programs',
            collapsible: true,
            collapsed: true,
            items: [
              { text: 'Jobs Program', link: '/kit/jobs-program' },
              { text: 'Staking Program', link: '/kit/staking-program' },
              { text: 'Merkle Distributor', link: '/kit/merkle-distributor' },
            ],
          },
          {
            text: 'Services',
            collapsible: true,
            collapsed: true,
            items: [
              { text: 'Solana Service', link: '/kit/solana-service' },
              { text: 'IPFS Service', link: '/kit/ipfs-service' },
              { text: 'Token Service', link: '/kit/token-service' },
              { text: 'API Service', link: '/kit/api-service' },
              { text: 'Authorization Service', link: '/kit/authorization-service' },
            ],
          },
          {
            text: 'Examples',
            collapsible: true,
            collapsed: true,
            items: [
              { text: 'Overview', link: '/kit/examples/' },
              { text: 'Basic Usage', link: '/kit/examples/basic-usage' },
              { text: 'Jobs', link: '/kit/examples/jobs' },
              { text: 'Staking', link: '/kit/examples/staking' },
              { text: 'IPFS', link: '/kit/examples/ipfs' },
              { text: 'Transactions', link: '/kit/examples/transactions' },
              { text: 'Partial Signing', link: '/kit/examples/partial-signing' },
            ],
          },
          ...getSdkReferenceSidebar(),
        ],
        '/hosts/': [
          {
            text: 'Host GPUs',
            items: [
              { text: 'Getting Started', link: '/hosts/grid' },
              { text: 'Running the Host', link: '/hosts/grid-run' },
              { text: 'Troubleshooting', link: '/hosts/troubleshoot' },
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
      },

      socialLinks: [{ icon: 'github', link: 'https://github.com/nosana-ci/nosana-kit' }],

      search: {
        provider: 'local',
      },

      footer: {
        message:
          '<a href="https://deploy.nosana.com" target="_blank" rel="noopener noreferrer">Deploy</a> · <a href="https://explore.nosana.com" target="_blank" rel="noopener noreferrer">Explore</a> · <a href="https://host.nosana.com" target="_blank" rel="noopener noreferrer">Host</a> · <a href="https://stake.nosana.com" target="_blank" rel="noopener noreferrer">Stake</a>',
        copyright: '© 2026 <b>Nosana</b>',
      },
    },

    markdown: {
      math: true,
      // Enhanced code block features
      lineNumbers: true,
      // Twoslash transformer for type hover information
      codeTransformers: [
        transformerTwoslash({
          twoslashOptions: {
            compilerOptions: {
              skipLibCheck: true,
              skipDefaultLibCheck: true,
            },
          },
        }),
      ],
      languages: ['ts', 'typescript', 'tsx', 'js', 'javascript', 'json', 'bash', 'shell'],
      // Tabs plugin for VuePress-style tabs syntax
      // Chart plugin for Chart.js charts
      // Glossary plugin for automatic term linking
      config(md) {
        md.use(tabsMarkdownPlugin);
        md.use(chartPlugin);
        md.use(markdownGlossaryPlugin, {
          glossary: glossary,
          firstOccurrenceOnly: true,
        });
      },
    },

    // Ensure VitePress serves .md files from the api directory
    srcExclude: ['**/node_modules/**', '**/.git/**'],
  })
);
