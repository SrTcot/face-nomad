export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'campo-green': {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        'campo-brown': {
          50: '#faf8f5',
          100: '#f5f1ea',
          200: '#e8dccb',
          300: '#d4ba94',
          400: '#c49a6b',
          500: '#a67c52',
          600: '#8b6641',
          700: '#6f5133',
          800: '#59412a',
          900: '#483424',
        }
      },
      fontSize: {
        'touch': '1.125rem',
        'touch-lg': '1.5rem',
      },
      spacing: {
        'touch': '3rem',
        'touch-lg': '5rem',
      }
    },
  },
  plugins: [],
}
