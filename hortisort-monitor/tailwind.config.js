/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        success: '#16a34a',
        warning: '#eab308',
        danger: '#dc2626',
        offline: '#6b7280',
        bg: {
          DEFAULT:  'rgb(var(--bg) / <alpha-value>)',
          surface1: 'rgb(var(--bg-surface1) / <alpha-value>)',
          surface2: 'rgb(var(--bg-surface2) / <alpha-value>)',
          surface3: 'rgb(var(--bg-surface3) / <alpha-value>)',
        },
        line: {
          DEFAULT: 'rgb(var(--line) / <alpha-value>)',
          strong:  'rgb(var(--line-strong) / <alpha-value>)',
        },
        fg: {
          1: 'rgb(var(--fg-1) / <alpha-value>)',
          2: 'rgb(var(--fg-2) / <alpha-value>)',
          3: 'rgb(var(--fg-3) / <alpha-value>)',
          4: 'rgb(var(--fg-4) / <alpha-value>)',
          5: 'rgb(var(--fg-5) / <alpha-value>)',
          6: 'rgb(var(--fg-6) / <alpha-value>)',
        },
        brand: {
          cyan:   '#38bdf8',
          green:  '#4ade80',
          amber:  '#fbbf24',
          red:    '#ef4444',
          purple: '#a78bfa',
          pink:   '#f43f5e',
          orange: '#f97316',
        },
      },
      animation: {
        'pulse-dot': 'pulseDot 1.5s ease-in-out infinite',
        'slide-in':  'slideIn 0.3s ease',
      },
      keyframes: {
        pulseDot: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.4' } },
        slideIn:  {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to:   { transform: 'translateX(0)',    opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
