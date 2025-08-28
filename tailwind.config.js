// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",             // si usas vite con index.html en root
    "./src/**/*.{js,jsx,ts,tsx}" // todos los archivos React
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
