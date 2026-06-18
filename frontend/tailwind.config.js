/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'medical-green': {
          50:  '#F0FFF8',
          100: '#D1FAE5',
          500: '#00A86B',
          600: '#009960',
          700: '#007A4D',
          DEFAULT: '#00A86B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
