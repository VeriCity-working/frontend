import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // VeriCity civic-ledger palette — deliberately not a SaaS blue/violet kit.
        ink: {
          DEFAULT: "#1B2430", // near-navy ink, primary text on paper
          soft: "#3A4656"
        },
        paper: {
          DEFAULT: "#EEF0EA", // pale stone/concrete, main app background
          raised: "#F7F8F4",  // card surface, slightly lighter than base
          line: "#D7DACE"     // hairline borders
        },
        signal: {
          DEFAULT: "#E0932F", // caution amber — pending / in-progress states
          soft: "#FBEBD3"
        },
        verified: {
          DEFAULT: "#3F7D58", // confirmed / resolved green
          soft: "#DEEAE1"
        },
        brick: {
          DEFAULT: "#A8452C", // disputed / reopened / urgent
          soft: "#F1DED8"
        },
        steel: {
          DEFAULT: "#4C6B8A", // authority role accent
          soft: "#DEE6ED"
        },
        officer: {
          DEFAULT: "#6B5B95", // officer role accent
          soft: "#E7E2F0"
        }
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-plex)", "system-ui", "sans-serif"],
        mono: ["var(--font-plex-mono)", "ui-monospace", "monospace"]
      },
      borderRadius: {
        sm: "3px",
        DEFAULT: "5px",
        lg: "8px"
      },
      boxShadow: {
        card: "0 1px 0 rgba(27,36,48,0.06), 0 1px 3px rgba(27,36,48,0.05)"
      }
    }
  },
  plugins: []
};

export default config;
