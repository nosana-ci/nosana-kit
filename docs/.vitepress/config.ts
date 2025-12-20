import { defineConfig } from 'vitepress';
import { transformerTwoslash } from '@shikijs/vitepress-twoslash';
import { tabsMarkdownPlugin } from 'vitepress-plugin-tabs';
import { withMermaid } from 'vitepress-plugin-mermaid';
import chartPlugin from './plugins/chart';

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

export default withMermaid(defineConfig({
  title: 'Nosana Docs',
  description: 'Complete documentation for the Nosana Network - SDK, protocols, and guides',
  base: '/',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      {
        text: 'Kit',
        items: [
          { text: 'Guide', link: '/guide/' },
          { text: 'Examples', link: '/examples/' },
          { text: 'SDK Reference', link: '/api/' },
        ]
      },
      { text: 'Smart Contracts', link: '/protocols/start' },
      {
        text: 'Host GPUs',
        items: [
          { text: 'Getting Started', link: '/hosts/grid' },
          { text: 'Ubuntu Setup', link: '/hosts/grid-ubuntu' },
          { text: 'Running the Host', link: '/hosts/grid-run' },
          { text: 'Troubleshooting', link: '/hosts/troubleshoot' },
        ]
      },
      { text: 'Run Inference', link: '/inference/quick_start' },
      { text: 'Wallet', link: '/wallet/token' },
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
      '/inference/': [
        {
          text: 'Run Inference (CLI)',
          items: [
            { text: 'Quick Start', link: '/inference/quick_start' },
            { text: 'Writing a Job', link: '/inference/writing_a_job' },
            { text: 'Models', link: '/inference/models' },
            { text: 'Literals', link: '/inference/literals' },
            { text: 'Tutorial Hub', link: '/inference/tutorialHub' },
            {
              text: 'Examples',
              items: [
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
      '/protocols/': [
        {
          text: 'Smart Contracts',
          items: [
            { text: 'Getting Started', link: '/protocols/start' },
            { text: 'Staking', link: '/protocols/staking' },
            { text: 'Rewards', link: '/protocols/rewards' },
            { text: 'Pools', link: '/protocols/pools' },
            { text: 'Jobs', link: '/protocols/jobs' },
            { text: 'Nodes', link: '/protocols/nodes' },
            { text: 'Token', link: '/protocols/token' },
          ],
        },
      ],
      '/wallet/': [
        {
          text: 'Wallet',
          items: [
            { text: 'Token', link: '/wallet/token' },
            { text: 'Key', link: '/wallet/key' },
          ],
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
    config(md) {
      md.use(tabsMarkdownPlugin);
      md.use(chartPlugin);
    },
  },

  // Ensure VitePress serves .md files from the api directory
  srcExclude: ['**/node_modules/**', '**/.git/**'],
}));
