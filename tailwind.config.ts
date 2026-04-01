import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./pages/**/*.{ts,tsx}','./components/**/*.{ts,tsx}','./hooks/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        pitch: { DEFAULT: '#080C12', 50: '#0D1420', 100: '#111A26', 200: '#162030' },
        volt: { DEFAULT: '#C8F135', dim: '#8AAA1E', glow: '#D4FF4A' },
        ice: { DEFAULT: '#4DC8E8', dim: '#2A8FAA' },
        fire: { DEFAULT: '#FF4C2B', dim: '#CC3D22' },
        ghost: { DEFAULT: 'rgba(255,255,255,0.06)', hover: 'rgba(255,255,255,0.10)' },
      },
      animation: {
        'pulse-volt': 'pulseVolt 0.6s ease-out forwards',
        'pulse-fire': 'pulseFire 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'shimmer': 'shimmer 1.5s infinite',
        'tick': 'tick 1s ease-in-out infinite',
      },
      keyframes: {
        pulseVolt: { '0%': { backgroundColor: 'rgba(200,241,53,0.3)' }, '100%': { backgroundColor: 'transparent' } },
        pulseFire: { '0%': { backgroundColor: 'rgba(255,76,43,0.3)' }, '100%': { backgroundColor: 'transparent' } },
        slideUp: { '0%': { transform: 'translateY(8px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        tick: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.4' } },
      },
    }
  },
  plugins: [],
}
export default config
