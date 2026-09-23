import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          base: 'var(--bg-base)',
          surface: 'var(--bg-surface)',
          elevated: 'var(--bg-elevated)',
          glass: 'var(--bg-glass)',
        },
        border: {
          glass: 'var(--border-glass)',
          glow: 'var(--border-glow)',
        },
        accent: {
          primary: 'var(--accent-primary)',
          'primary-hover': 'var(--accent-primary-hover)',
          secondary: 'var(--accent-secondary)',
          cta: 'var(--accent-cta)',
          warning: 'var(--accent-warning)',
          danger: 'var(--accent-danger)',
          ai: 'var(--accent-ai)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          inverse: 'var(--text-inverse)',
        },
        status: {
          discovered: 'var(--status-discovered)',
          matched: 'var(--status-matched)',
          queued: 'var(--status-queued)',
          applied: 'var(--status-applied)',
          'needs-review': 'var(--status-needs-review)',
          interviewing: 'var(--status-interview)',
          offer: 'var(--status-offer)',
          rejected: 'var(--status-rejected)',
          failed: 'var(--status-failed)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)'],
        mono: ['var(--font-mono)'],
        sans: ['var(--font-display)'],
      },
      fontSize: {
        xs: ['var(--text-xs)', { lineHeight: '1.4' }],
        sm: ['var(--text-sm)', { lineHeight: '1.5' }],
        base: ['var(--text-base)', { lineHeight: '1.5' }],
        lg: ['var(--text-lg)', { lineHeight: '1.4' }],
        xl: ['var(--text-xl)', { lineHeight: '1.3' }],
        '2xl': ['var(--text-2xl)', { lineHeight: '1.25' }],
        '3xl': ['var(--text-3xl)', { lineHeight: '1.2' }],
        '4xl': ['var(--text-4xl)', { lineHeight: '1.1' }],
      },
      spacing: {
        1: 'var(--space-1)',
        2: 'var(--space-2)',
        3: 'var(--space-3)',
        4: 'var(--space-4)',
        5: 'var(--space-5)',
        6: 'var(--space-6)',
        8: 'var(--space-8)',
        10: 'var(--space-10)',
        12: 'var(--space-12)',
        16: 'var(--space-16)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        elevated: 'var(--shadow-elevated)',
        accent: 'var(--shadow-accent)',
      },
      animation: {
        'agent-pulse': 'agent-pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'fill-bar': 'fill-bar 0.6s ease-out forwards',
        'blink-cursor': 'blink-cursor 1s step-end infinite',
        shimmer: 'shimmer 1.8s linear infinite',
        'fade-in': 'fade-in 0.25s ease-out',
      },
      keyframes: {
        'agent-pulse': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(108,99,255,0.4)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)', boxShadow: '0 0 0 8px rgba(108,99,255,0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fill-bar': {
          from: { width: '0%' },
          to: { width: 'var(--tw-bar-width)' },
        },
        'blink-cursor': {
          '0%, 100%': { borderColor: 'transparent' },
          '50%': { borderColor: '#6C63FF' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-700px 0' },
          '100%': { backgroundPosition: '700px 0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      transitionDuration: {
        250: '250ms',
        350: '350ms',
      },
    },
  },
  plugins: [],
}
export default config