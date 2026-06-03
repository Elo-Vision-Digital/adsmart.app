/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Montserrat', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: 'var(--bg)',
        surface: 'var(--bg-elev)',
        'surface-2': 'var(--bg-elev-2)',
        'surface-inset': 'var(--bg-inset)',
        scrim: 'var(--scrim)',
        foreground: 'var(--text)',
        muted: 'var(--text-2)',
        'muted-foreground': 'var(--text-3)',
        'text-on-accent': 'var(--text-on-accent)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        separator: 'var(--separator)',
        primary: 'var(--accent)',
        'primary-hover': 'var(--accent-hover)',
        'primary-fg': 'var(--accent-fg)',
        'quiet-hover': 'var(--quiet-hover)',
        'quiet-press': 'var(--quiet-press)',
        success: 'var(--success)',
        'success-bg': 'var(--success-bg)',
        warning: 'var(--warning)',
        'warning-bg': 'var(--warning-bg)',
        danger: 'var(--danger)',
        'danger-bg': 'var(--danger-bg)',
        positive: 'var(--positive)',
        'positive-bg': 'var(--positive-bg)',
        'chart-1': 'var(--chart-1)',
        'chart-2': 'var(--chart-2)',
        'chart-3': 'var(--chart-3)',
        'chart-4': 'var(--chart-4)',
      },
      boxShadow: {
        '1': 'var(--shadow-1)',
        '2': 'var(--shadow-2)',
        '3': 'var(--shadow-3)',
      },
      borderRadius: {
        'xs': 'var(--r-xs)',
        'sm': 'var(--r-sm)',
        'md': 'var(--r-md)',
        'lg': 'var(--r-lg)',
        'xl': 'var(--r-xl)',
        'pill': 'var(--r-pill)',
      },
      animation: {
        'slide-in': 'slideIn 0.2s ease-out',
        'slide-out': 'slideOut 0.2s ease-out',
        'fade-in-up': 'fade-in-up 0.6s ease-out',
        'fade-in': 'fade-in 0.6s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideOut: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}