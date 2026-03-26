/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lottery: {
          primary: "var(--lottery-primary)",
          dark: "var(--lottery-dark)",
          light: "var(--lottery-light)",
        }
      }
    },
  },
  plugins: [],
}
