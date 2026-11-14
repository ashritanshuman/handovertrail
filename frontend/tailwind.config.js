/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        parchment: "#F4F3EE",
        card: "#FFFFFF",
        border: "var(--border, #d8d0c0)",
        "border-default": "var(--border, #d8d0c0)",
        silver: "var(--border, #d8d0c0)",
        "text-strong": "var(--text-strong, #241d18)",
        "text-nav": "var(--text-nav, #413934)",
        "text-body": "var(--text-body, #5C544F)",
        "text-muted": "var(--text-muted, #6B635E)",
        "accent-text": "var(--accent-text, #8d3b2a)",
        strong: "var(--text-strong, #241d18)",
        nav: "var(--text-nav, #413934)",
        body: "var(--text-body, #5C544F)",
        muted: "var(--text-muted, #6B635E)",
        btn: {
          primary: "#2B2521",
          hover: "#1f1a17",
        },
        taupe: {
          DEFAULT: "var(--text-strong, #241d18)",
          hover: "#1f1a17",
          active: "#0f0c0a",
        },
        "grey-olive": "var(--text-muted, #6B635E)",
        blush: {
          DEFAULT: "#E0AFA0",
          tint: "rgba(224, 175, 160, 0.12)",
          subtle: "rgba(224, 175, 160, 0.20)",
        },
        status: {
          verified: {
            DEFAULT: "#38523A",
            tint: "rgba(95, 122, 97, 0.12)",
            border: "rgba(95, 122, 97, 0.35)",
          },
          inferred: {
            DEFAULT: "#3C5066",
            tint: "rgba(107, 127, 148, 0.12)",
            border: "rgba(107, 127, 148, 0.35)",
          },
          conflicting: {
            DEFAULT: "#8F5105",
            tint: "rgba(201, 130, 43, 0.12)",
            border: "rgba(201, 130, 43, 0.35)",
          },
          missing: {
            DEFAULT: "var(--text-muted, #6B635E)",
            tint: "rgba(107, 99, 94, 0.12)",
            border: "rgba(107, 99, 94, 0.35)",
          },
        },
      },
      fontFamily: {
        serif: ["Fraunces", "Georgia", "serif"],
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      fontSize: {
        "display-stat": ["2.25rem", { lineHeight: "2.75rem", letterSpacing: "-0.03em", fontWeight: "500" }],
        "headline-page": ["1.75rem", { lineHeight: "2.25rem", letterSpacing: "-0.02em", fontWeight: "600" }],
        "headline-section": ["1.125rem", { lineHeight: "1.625rem", letterSpacing: "-0.01em", fontWeight: "600" }],
        "subline": ["1.125rem", { lineHeight: "1.75rem", letterSpacing: "-0.01em", fontWeight: "400" }],
        "body-default": ["1rem", { lineHeight: "1.5rem", letterSpacing: "-0.005em", fontWeight: "400" }],
        "body-medium": ["1rem", { lineHeight: "1.5rem", letterSpacing: "-0.005em", fontWeight: "500" }],
        "label-caption": ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.01em", fontWeight: "500" }],
        "label-mono-metadata": ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.04em", fontWeight: "600" }],
      },
      borderRadius: {
        sm: "0.333rem",
        DEFAULT: "0.667rem",
        btn: "0.833rem",
        xl: "1rem",
        "2xl": "1.333rem",
        full: "9999px",
      },
      boxShadow: {
        card: "0 1.33px 2.67px rgba(70, 63, 58, 0.06)",
        float: "0 5.33px 21.33px -2.67px rgba(70, 63, 58, 0.08)",
        modal: "0 16px 42.67px -5.33px rgba(70, 63, 58, 0.14)",
      },
    },
  },
  plugins: [],
};
