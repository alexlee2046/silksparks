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
        // CSS variable-based colors for theme support
        background: "rgb(var(--color-background) / <alpha-value>)",
        "background-alt": "rgb(var(--color-background-alt) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        "surface-border": "rgb(var(--color-surface-border) / <alpha-value>)",
        foreground: "rgb(var(--color-text-primary) / <alpha-value>)",
        "text-muted": "rgb(var(--color-text-muted) / <alpha-value>)",
        primary: "rgb(var(--color-primary) / <alpha-value>)",
        "primary-hover": "rgb(var(--color-primary-hover) / <alpha-value>)",
        // Legacy aliases for backward compatibility
        "background-dark": "rgb(var(--color-background) / <alpha-value>)",
        "surface-dark": "rgb(var(--color-surface) / <alpha-value>)",
        // Status colors (theme-independent)
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
