import { defineConfig } from 'vitepress';
import { transformerTwoslash } from '@shikijs/vitepress-twoslash';

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

export default defineConfig({
  title: 'Nosana Kit',
  description: 'TypeScript SDK for interacting with the Nosana Network on Solana',
  base: '/',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' },
      { text: 'Examples', link: '/examples/' },
      { text: 'SDK Reference', link: '/api/' },
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
          ],
        },
      ],
      '/api/': getApiSidebar(),
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/nosana-ci/nosana-kit' }],

    search: {
      provider: 'local',
    },
  },

  markdown: {
    // Enhanced code block features
    lineNumbers: true,
    // Twoslash transformer for type hover information
    codeTransformers: [transformerTwoslash()],
    languages: ['ts', 'typescript', 'tsx', 'js', 'javascript', 'json', 'bash', 'shell'],
  },

  // Ensure VitePress serves .md files from the api directory
  srcExclude: ['**/node_modules/**', '**/.git/**'],
});
