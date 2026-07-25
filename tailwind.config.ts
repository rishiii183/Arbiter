import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1.5rem", lg: "5rem" },
      screens: { "2xl": "1280px" },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "Neue Haas Grotesk Display", "system-ui", "sans-serif"],
        body: ["Jost", "Söhne", "system-ui", "sans-serif"],
        serif: ["Playfair Display", "Freight Display Pro", "Georgia", "serif"],
        display: ["Outfit", "Satoshi", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        cream: "hsl(var(--cream))",
        ink: "hsl(var(--ink))",
        mustard: { DEFAULT: "hsl(var(--mustard))", light: "hsl(var(--mustard-light))" },
        teal: {
          deep: "hsl(var(--teal-deep))",
          light: "hsl(var(--teal-light))",
          wash: "hsl(var(--teal-wash))",
        },
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        warning: { DEFAULT: "hsl(var(--warning))", foreground: "hsl(var(--warning-foreground))" },
        success: { DEFAULT: "hsl(var(--success))", foreground: "hsl(var(--success-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        info: { DEFAULT: "hsl(var(--info))", foreground: "hsl(var(--info-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        surface: { dark: "hsl(var(--surface-dark))", mid: "hsl(var(--surface-mid))" },
      },
      borderRadius: {
        lg: "8px",
        md: "var(--radius)",
        sm: "calc(var(--radius) - 1px)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-up": "fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fade-in 0.4s ease-out both",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
