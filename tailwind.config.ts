import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        arena: {
          950: "#090a0f",
          900: "#10131d",
          800: "#181d2b",
          700: "#242b3d"
        },
        p1: {
          500: "#ef4444",
          600: "#dc2626"
        },
        p2: {
          500: "#3b82f6",
          600: "#2563eb"
        },
        tier: {
          street: "#8b95a7",
          planet: "#33c27f",
          cosmic: "#4da3ff",
          outer: "#d8b55a"
        }
      },
      boxShadow: {
        battle: "0 20px 80px rgba(0, 0, 0, 0.35)"
      }
    }
  },
  plugins: []
};

export default config;
