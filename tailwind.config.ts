
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#3BB873",
          hover: "#35A367",
          light: "#48C285",
        },
        secondary: {
          DEFAULT: "#F2F4F5",
          hover: "#E8EBED",
        },
        accent: {
          DEFAULT: "#3BB873",
          hover: "#35A367",
        },
        text: {
          DEFAULT: "#1A1A1A",
          muted: "#6B7280",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          dark: "#1C1C1C",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      boxShadow: {
        neumorph: '8px 8px 16px var(--shadow-base), -8px -8px 16px var(--shadow-highlight)',
        'neumorph-hover': '6px 6px 12px var(--shadow-base), -6px -6px 12px var(--shadow-highlight)',
        'neumorph-active': 'inset 4px 4px 8px var(--shadow-base), inset -4px -4px 8px var(--shadow-highlight)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { 
            opacity: "0",
            transform: "translateY(10px)"
          },
          "100%": { 
            opacity: "1",
            transform: "translateY(0)"
          },
        },
        "fade-out": {
          "0%": { 
            opacity: "1",
            transform: "translateY(0)"
          },
          "100%": { 
            opacity: "0",
            transform: "translateY(10px)"
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in var(--animation-duration) ease-out forwards",
        "fade-out": "fade-out var(--animation-duration) ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

