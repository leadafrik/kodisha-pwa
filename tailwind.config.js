/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'kenya-green': '#27AE60',
        'kenya-black': '#000000', 
        'kenya-red': '#BB0000',
      }
    },
  },
  plugins: [],
}