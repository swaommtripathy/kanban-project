import type { Config } from "tailwindcss";

const config: Config = {
  // 🔴 CRITICAL: ADD THIS LINE RIGHT HERE TO ENABLE CLASS DIRECT DOM TOGGLING
  darkMode: 'class', 
  
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;