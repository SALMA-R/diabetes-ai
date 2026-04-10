/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'medical-blue': '#1A5276',
        'health-green': '#1E8449',
      },
    },
  },
  plugins: [],
}
