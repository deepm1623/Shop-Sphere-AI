import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17221d",
        muted: "#6c776f",
        cream: "#f8f8f3",
        sage: "#dce9dc",
        leaf: "#2f6b48",
        coral: "#e57358",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Arial", "sans-serif"],
        display: ["var(--font-fraunces)", "Georgia", "serif"],
      },
      boxShadow: { soft: "0 14px 40px rgba(35, 62, 45, .10)" },
    },
  },
  plugins: [],
};

export default config;
