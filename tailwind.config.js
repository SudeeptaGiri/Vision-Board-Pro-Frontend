/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // New refined warm palette
        warm: {
          bg: "#faf8f6",
          card: "#f0ebe4",
          border: "#e8dfd5",
          text: "#2d2418",
          muted: "#6b5d4f",
          highlight: "#f4e8d9",
        },
        terracotta: {
          DEFAULT: "#d97757",
          hover: "#c65d3b",
          light: "#e8a08a",
        },
        sage: {
          DEFAULT: "#7aa896",
          hover: "#5a8a7a",
          light: "#a8c9bf",
        },
        status: {
          success: "#78b892",
          warning: "#e8b86d",
          alert: "#d88b74",
        },
        // Keep coffee as alias for backward compatibility
        coffee: {
          cream: "#faf8f6",
          light: "#f0ebe4",
          medium: "#6b5d4f",
          dark: "#2d2418",
          espresso: "#2d2418",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        warm: "0 4px 14px 0 rgba(45, 36, 24, 0.08)",
        "warm-lg": "0 10px 40px -10px rgba(45, 36, 24, 0.12)",
        terracotta: "0 4px 14px 0 rgba(217, 119, 87, 0.2)",
        sage: "0 4px 14px 0 rgba(122, 168, 150, 0.2)",
      },
      backgroundImage: {
        "warm-gradient": "linear-gradient(135deg, #d97757 0%, #c65d3b 100%)",
        "sage-gradient": "linear-gradient(135deg, #7aa896 0%, #5a8a7a 100%)",
        "warm-radial": "radial-gradient(circle, #f4e8d9 0%, #f0ebe4 100%)",
        "cta-gradient": "linear-gradient(135deg, #d97757 0%, #e8a08a 100%)",
      },
    },
  },
  plugins: [],
};
