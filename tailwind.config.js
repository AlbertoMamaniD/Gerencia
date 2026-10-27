/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#070B14",
          dark: "#04070D",
          light: "#0D1527",
        },
        card: {
          DEFAULT: "#0D1527",
          subtle: "#111C33",
          border: "#1E2D4A",
          active: "#162544",
        },
        primary: {
          DEFAULT: "#0066FF",
          glow: "#3B82F6",
          dark: "#0047B3",
        },
        accent: {
          DEFAULT: "#00F0FF",
          glow: "#38BDF8",
          dark: "#0284C7",
        },
        success: {
          DEFAULT: "#10B981",
          glow: "#34D399",
          dark: "#047857",
        },
        warning: {
          DEFAULT: "#F59E0B",
          glow: "#FBBF24",
          dark: "#B45309",
        },
        danger: {
          DEFAULT: "#EF4444",
          glow: "#F87171",
          dark: "#B91C1C",
        },
        telemetry: {
          cyan: "#00F0FF",
          volt: "#A855F7",
          amp: "#F59E0B",
          hz: "#10B981",
          pf: "#EC4899",
        },
        slate: {
          850: "#131E35",
          950: "#070B14",
        },
      },
    },
  },
  plugins: [],
};
