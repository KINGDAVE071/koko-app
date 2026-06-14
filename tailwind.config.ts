import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palette cosmique / sunset
        "cosmic": {
          50:  "#FEF7EE",
          100: "#FDEAD2",
          200: "#FBD1A5",
          300: "#F8B16E",
          400: "#F58A3D",
          500: "#F06543", // Corail vif (bouton)
          600: "#E64A2E",
          700: "#C13A25",
          800: "#9B2F23",
          900: "#7E2A20",
        },
        "midnight": "#0F172A",       // Bleu nuit profond
        "teal-deep": "#115E59",      // Bleu-vert canard
        "solar-flare": "#F97316",    // Orange/corail doux
        "golden-glow": "#FDE047",    // Jaune pâle/crème
        // Conserver les anciennes couleurs pour compatibilité
        "koko-primary": "#E67E22",
        "koko-primary-light": "#F39C12",
        "koko-primary-dark": "#D35400",
        "koko-bg": "#F8FAFC",
        "koko-surface": "#FFFFFF",
        // ... (autres couleurs existantes inchangées)
      },
      // ... (le reste du theme.extend actuel, y compris fontFamily, borderRadius, boxShadow, etc.)
      fontFamily: {
        sans: ["Nunito", "sans-serif"],
        arabic: ["Cairo", "sans-serif"],
        zh: ['"Noto Sans SC"', "sans-serif"],
        jp: ['"Noto Sans JP"', "sans-serif"],
      },
      fontSize: {
        base: ["1rem", { lineHeight: "1.75" }],
      },
      borderRadius: {
        DEFAULT: "0.75rem",
        sm: "0.5rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
        full: "9999px",
      },
      boxShadow: {
        card: "0 2px 8px rgba(0,0,0,0.05)",
        "card-hover": "0 8px 24px rgba(0,0,0,0.10)",
        float: "0 4px 16px rgba(230,126,34,0.20)",
        nav: "0 -1px 0 rgba(0,0,0,0.06), 0 -8px 24px rgba(0,0,0,0.04)",
      },
      backgroundImage: {
        "gradient-orange": "linear-gradient(135deg, #E67E22 0%, #F39C12 100%)",
        "gradient-warm": "linear-gradient(135deg, #FEF3E7 0%, #FDDCB5 100%)",
        "gradient-dark": "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
        "gradient-cosmic": "linear-gradient(135deg, #0F172A 0%, #115E59 100%)",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down": {
          from: { opacity: "0", transform: "translateY(-16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.94)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "pulse-logo": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.7", transform: "scale(1.05)" },
        },
        shimmer: {
          from: { backgroundPosition: "-200% 0" },
          to: { backgroundPosition: "200% 0" },
        },
        "dot-bounce": {
          "0%, 80%, 100%": { transform: "scale(0.8)", opacity: "0.5" },
          "40%": { transform: "scale(1.2)", opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.35s ease-out both",
        "slide-up": "slide-up 0.4s cubic-bezier(0.4,0,0.2,1) both",
        "slide-down": "slide-down 0.4s cubic-bezier(0.4,0,0.2,1) both",
        "scale-in": "scale-in 0.3s cubic-bezier(0.34,1.56,0.64,1) both",
        "pulse-logo": "pulse-logo 2s ease-in-out infinite",
        shimmer: "shimmer 1.6s linear infinite",
        "dot-1": "dot-bounce 1.2s ease-in-out infinite 0ms",
        "dot-2": "dot-bounce 1.2s ease-in-out infinite 160ms",
        "dot-3": "dot-bounce 1.2s ease-in-out infinite 320ms",
      },
    },
  },
  plugins: [],
};

export default config;
