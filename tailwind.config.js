/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#00b96b",
        dark: {
          100: "#d1d1d1",
          200: "#a6a6a6",
          300: "#303030",
          400: "#1f1f1f",
          500: "#141414",
        },
      },
    },
  },
  plugins: [],
};
