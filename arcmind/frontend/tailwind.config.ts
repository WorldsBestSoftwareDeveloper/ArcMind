import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        arc: {
          blue: "#3B82F6",
          cyan: "#22D3EE",
          navy: "#020617",
          panel: "#0F172A",
          violet: "#8B5CF6"
        }
      },
      boxShadow: {
        liquid: "0 24px 80px rgba(34, 211, 238, 0.12), inset 0 1px 0 rgba(255,255,255,0.14)",
        glow: "0 0 42px rgba(59, 130, 246, 0.34)"
      },
      backgroundImage: {
        "liquid-radial": "radial-gradient(circle at 20% 10%, rgba(59,130,246,.28), transparent 30%), radial-gradient(circle at 80% 0%, rgba(34,211,238,.18), transparent 28%), linear-gradient(135deg, #020617 0%, #0f172a 45%, #111827 100%)"
      }
    }
  },
  plugins: []
};

export default config;
