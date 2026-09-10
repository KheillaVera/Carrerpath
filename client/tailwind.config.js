/** @type {import('tailwindcss').Config} */

// Semantic colors are backed by CSS variables declared in src/index.css, so the
// whole UI re-themes by toggling the `dark` class on <html>. Each variable holds
// a space-separated RGB triple so Tailwind's `/opacity` modifiers keep working.
const token = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    // A deliberate type scale. Sizes are in rem, paired with a line height and the
    // tracking that size wants — large text tightens, small text stays open.
    fontSize: {
      '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.01em' }],
      xs: ['0.75rem', { lineHeight: '1.125rem', letterSpacing: '0.005em' }],
      sm: ['0.8125rem', { lineHeight: '1.25rem' }],
      base: ['0.9375rem', { lineHeight: '1.5rem' }],
      lg: ['1.0625rem', { lineHeight: '1.625rem', letterSpacing: '-0.005em' }],
      xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.014em' }],
      '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.019em' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.021em' }],
      '4xl': ['2.375rem', { lineHeight: '2.75rem', letterSpacing: '-0.025em' }],
      '5xl': ['3rem', { lineHeight: '3.25rem', letterSpacing: '-0.03em' }],
      '6xl': ['3.75rem', { lineHeight: '4rem', letterSpacing: '-0.033em' }],
      '7xl': ['4.5rem', { lineHeight: '4.75rem', letterSpacing: '-0.036em' }],
    },
    extend: {
      colors: {
        // PathAura brand — warm clay / terracotta.
        brand: {
          50: '#fdf5f2',
          100: '#fbe9e3',
          200: '#f5cec1',
          300: '#eaac97',
          400: '#dd8262',
          500: '#c9603c',
          600: '#b04a2c',
          700: '#8f3b26',
          800: '#743323',
          900: '#5f2d21',
          950: '#341510',
        },
        surface: token('surface'),
        panel: token('panel'),
        elevated: token('elevated'),
        sunken: token('sunken'),
        ink: {
          DEFAULT: token('ink'),
          soft: token('ink-soft'),
        },
        muted: token('muted'),
        faint: token('faint'),
        line: {
          DEFAULT: token('line'),
          strong: token('line-strong'),
        },
        accent: {
          DEFAULT: token('accent'),
          soft: token('accent-soft'),
          contrast: token('accent-contrast'),
        },
        scrim: token('scrim'),
        danger: { DEFAULT: token('danger'), bg: token('danger-bg'), line: token('danger-line') },
        warn: { DEFAULT: token('warn'), bg: token('warn-bg'), line: token('warn-line') },
        success: { DEFAULT: token('success'), bg: token('success-bg'), line: token('success-line') },
        info: { DEFAULT: token('info'), bg: token('info-bg'), line: token('info-line') },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        // Used sparingly, for editorial moments only — never for UI chrome.
        display: ['Instrument Serif', 'Iowan Old Style', 'Georgia', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.375rem',
        md: '0.5rem',
        lg: '0.625rem',
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
      // Restrained, layered shadows. Flat surfaces stay flat; only things that
      // genuinely float (menus, dialogs, toasts) get depth.
      boxShadow: {
        xs: '0 1px 2px 0 rgb(var(--c-shadow) / 0.04)',
        sm: '0 1px 2px 0 rgb(var(--c-shadow) / 0.04), 0 1px 3px 0 rgb(var(--c-shadow) / 0.03)',
        md: '0 2px 4px -2px rgb(var(--c-shadow) / 0.06), 0 6px 16px -4px rgb(var(--c-shadow) / 0.08)',
        lg: '0 4px 8px -4px rgb(var(--c-shadow) / 0.06), 0 16px 40px -12px rgb(var(--c-shadow) / 0.14)',
        overlay: '0 8px 16px -8px rgb(var(--c-shadow) / 0.12), 0 32px 72px -24px rgb(var(--c-shadow) / 0.28)',
        none: 'none',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
        'in-out': 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
      transitionDuration: {
        120: '120ms',
        180: '180ms',
        240: '240ms',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'translateY(4px) scale(0.985)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'slide-in-left': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(12px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
      },
      animation: {
        'fade-in': 'fade-in 180ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-up': 'fade-up 240ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'scale-in': 'scale-in 180ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-in-left': 'slide-in-left 240ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-in-right': 'slide-in-right 240ms cubic-bezier(0.22, 1, 0.36, 1) both',
        shimmer: 'shimmer 1.6s linear infinite',
      },
      maxWidth: {
        prose: '68ch',
      },
    },
  },
  plugins: [],
};
