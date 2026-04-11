/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Poppins", "Segoe UI", "sans-serif"],
        body: ["Manrope", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        panel: "0 24px 80px rgba(15, 23, 42, 0.16)",
      },
      colors: {
        ink: "#0f172a",
        mist: "#f8fafc",
        accent: "#ff7a18",
        accentSoft: "#ffd9bd",
        teal: "#0f766e",
      },
    },
  },
  plugins: [],
};
