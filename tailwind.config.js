/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#f4c025",
        "primary-hover": "#e0af1f",
        "background-light": "#f8f8f5",
        "background-dark": "#181611",
        "surface-dark": "#27241b",
        "surface-border": "#393528",
        "text-muted": "#bab29c",
        success: "#10b981",
        error: "#ef4444",
      },
      fontFamily: {
        display: ["Manrope", "sans-serif"],
        body: ["Noto Sans", "sans-serif"],
      },
      backgroundImage: {
        "silk-pattern":
          "radial-gradient(at 0% 0%, rgba(244, 192, 37, 0.03) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(244, 192, 37, 0.03) 0px, transparent 50%)",
        stars:
          "radial-gradient(white, rgba(255,255,255,.2) 2px, transparent 3px), radial-gradient(white, rgba(255,255,255,.15) 1px, transparent 2px)",
      },
    },
  },
  plugins: [],
};
