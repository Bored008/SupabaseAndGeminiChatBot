/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Geist Mono', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        zyricon: {
          bg: '#09050f',
          surface: '#11091d',
          sidebar: '#07040c',
          card: '#160d26',
          border: 'rgba(168, 85, 247, 0.15)',
          glow: 'rgba(168, 85, 247, 0.4)',
        },
      },
    },
  },
  plugins: [],
}
