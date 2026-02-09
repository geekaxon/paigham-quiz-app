/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2F1268",
          light: "#4A2A8A",
          dark: "#1E0A45",
          50: "#F0EBF8",
          100: "#DDD3F0",
          200: "#BBA7E1",
          300: "#9A7BD2",
          400: "#7850C3",
          500: "#2F1268",
        },
        secondary: "#F5F5F5",
      },
    },
  },
  plugins: [],
};
