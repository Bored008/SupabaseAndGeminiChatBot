/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        zyricon: {
          bg: '#000000',
          canvas: '#13091e',
          card: '#0f0819',
          box: '#11091d',
          border: 'rgba(255, 255, 255, 0.08)',
          purpleBorder: '#351d4c',
          pill: '#160d22',
          pillBorder: 'rgba(255, 255, 255, 0.08)',
          accent: '#8234e6',
          textMuted: '#766c89',
        },
      },
    },
  },
  plugins: [],
}
