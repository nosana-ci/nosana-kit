/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue"
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: '#1a202c',
          text: '#68d391',
          error: '#fc8181',
          success: '#68d391',
          info: '#63b3ed',
          warning: '#f6e05e'
        }
      }
    },
  },
  plugins: [],
} 