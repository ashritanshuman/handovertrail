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
        "border-default": "#E7E4DE",
        silver: "#BCB8B1",
        taupe: {
          DEFAULT: "#463F3A",
          hover: "#37312D",
          active: "#2B2724",
        },
        "grey-olive": "#8A817C",
        blush: {
          DEFAULT: "#E0AFA0",
          tint: "rgba(224, 175, 160, 0.12)",
          subtle: "rgba(224, 175, 160, 0.20)",
        },
        status: {
          verified: {
            DEFAULT: "#5F7A61",
            tint: "rgba(95, 122, 97, 0.12)",
            border: "rgba(95, 122, 97, 0.30)",
          },
          inferred: {
            DEFAULT: "#6B7F94",
            tint: "rgba(107, 127, 148, 0.12)",
            border: "rgba(107, 127, 148, 0.30)",
          },
          conflicting: {
            DEFAULT: "#C9822B",
            tint: "rgba(201, 130, 43, 0.12)",
            border: "rgba(201, 130, 43, 0.30)",
          },
          missing: {
            DEFAULT: "#8A817C",
            tint: "rgba(138, 129, 124, 0.12)",
            border: "rgba(138, 129, 124, 0.30)",
          },
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      fontSize: {
        "display-stat": ["36px", { lineHeight: "44px", letterSpacing: "-0.03em", fontWeight: "500" }],
        "headline-page": ["28px", { lineHeight: "36px", letterSpacing: "-0.02em", fontWeight: "600" }],
        "headline-section": ["16px", { lineHeight: "24px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "body-default": ["14px", { lineHeight: "22.4px", letterSpacing: "-0.005em", fontWeight: "400" }],
        "body-medium": ["14px", { lineHeight: "22.4px", letterSpacing: "-0.005em", fontWeight: "500" }],
        "label-caption": ["12px", { lineHeight: "16px", letterSpacing: "0.01em", fontWeight: "500" }],
        "label-mono-metadata": ["11px", { lineHeight: "14px", letterSpacing: "0.04em", fontWeight: "600" }],
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "8px",
        btn: "10px",
        xl: "12px",
        "2xl": "16px",
        full: "9999px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(70, 63, 58, 0.06)",
        float: "0 4px 16px -2px rgba(70, 63, 58, 0.08)",
        modal: "0 12px 32px -4px rgba(70, 63, 58, 0.14)",
      },
    },
  },
  plugins: [],
};
