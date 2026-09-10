import type { Config } from "tailwindcss";

// Todas as cores apontam para CSS variables definidas em app/globals.css,
// que trocam de valor conforme [data-theme="dark"] ou [data-theme="light"].
// Isso mantém uma única fonte de verdade para a paleta "graphite & signal".
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./features/**/*.{ts,tsx}"],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-elevated": "var(--surface-elevated)",
        border: {
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)",
        },
        text: {
          DEFAULT: "var(--text)",
          muted: "var(--text-muted)",
          faint: "var(--text-faint)",
        },
        signal: {
          DEFAULT: "var(--signal)",
          muted: "var(--signal-muted)",
        },
        ember: "var(--ember)",
        success: "var(--success)",
        error: "var(--error)",
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "14px",
        xl: "20px",
      },
      transitionTimingFunction: {
        nexus: "cubic-bezier(0.16, 1, 0.3, 1)",
        "nexus-spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      transitionDuration: {
        fast: "150ms",
        base: "220ms",
        slow: "300ms",
      },
    },
  },
  plugins: [],
};

export default config;
