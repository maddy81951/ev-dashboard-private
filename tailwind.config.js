/** @type {import('tailwindcss').Config} */
module.exports = {
  // Enables dark mode using class="dark"
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}