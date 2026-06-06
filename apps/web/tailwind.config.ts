import type { Config } from "tailwindcss"
import defaultTheme from "tailwindcss/defaultTheme"

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#1a1a2e',
        surface: '#16213e',
        deep: '#0f3460',
        accent: '#e94560',
      },
      fontFamily: {
        sans: ['var(--font-sans)', ...defaultTheme.fontFamily.sans],
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out both',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
