/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Primary tints ──
        "primary-dark": "#004d46",
        primary: "#00685f",
        "primary-mid": "#4da89f",
        "primary-light": "#dff0ed",

        // ── Accent ──
        accent: "#e8634a",
        "accent-hover": "#d4553d",

        // ── Neutrals ──
        "neutral-900": "#1e2f2d",
        "neutral-700": "#4a5c5a",
        "neutral-500": "#8a9c9a",
        "neutral-200": "#d6dfdd",
        "neutral-50": "#f3f6f5",

        // ── Semantic ──
        success: "#2e8b57",
        warning: "#d4953a",
        error: "#c94a4a",
      },
      fontFamily: {
        headline: ["Noto Serif", "serif"],
        body: ["Plus Jakarta Sans", "sans-serif"],
        label: ["Plus Jakarta Sans", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "1rem",
        lg: "2rem",
        xl: "3rem",
      },
    },
  },
  plugins: [],
}
