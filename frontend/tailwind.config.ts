import type { Config } from "tailwindcss";

const config: Config = {
  // 🎯 FORCE TAILWIND TO LISTEN TO DIRECT ROOT DOM CLASS MUTATIONS
  darkMode: 'class', 
  
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}" // Safeguard catch-all rule for components folder hierarchies
  ],
  theme: {
    extend: {
      // Your custom theme tokens go here if needed
    },
  },
  plugins: [],
};

export default config;
