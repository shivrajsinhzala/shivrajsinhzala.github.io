/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brutal: {
          black: '#0a0a0a',
          white: '#ffffff',
          yellow: '#FFE900',
          pink: '#FF006E',
          cyan: '#00F5FF',
          orange: '#FF5E00',
          purple: '#9D00FF',
          gray: '#F0F0F0',
          dark: '#111111',
          paper: '#f8f7f4',
        }
      }
    }
  },
  plugins: [],
}
