/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        megasena: {
          green: "#209869",
          "green-dark": "#006b3f",
          "green-light": "#b5db61",
        }
      }
    },
  },
  plugins: [],
}
