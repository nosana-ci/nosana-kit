// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-30',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss'
  ],
  css: ['~/assets/css/main.css'],
  ssr: false, // Disable SSR for better compatibility with Solana SDK
  nitro: {
    experimental: {
      wasm: true
    }
  },
  vite: {
    define: {
      global: 'globalThis',
    },
    optimizeDeps: {
      include: ['@nosana/kit'],
      exclude: ['gill/node', 'gill']
    },
    resolve: {
      alias: {
        'gill/node': 'gill'
      }
    }
  }
})
