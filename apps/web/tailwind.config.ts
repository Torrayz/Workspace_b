import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // ── Design System Color Tokens ─────────────────────────────────────
      colors: {
        primary: {
          DEFAULT: '#1E3A5F',
          50: '#EBF0F5',
          100: '#D7E1EB',
          200: '#AFC3D7',
          300: '#87A5C3',
          400: '#5F87AF',
          500: '#1E3A5F',
          600: '#1A3354',
          700: '#162C49',
          800: '#12243E',
          900: '#0E1D33',
        },
        accent: {
          DEFAULT: '#2563EB',
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#2563EB',
          600: '#1D4ED8',
          700: '#1E40AF',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          alt: '#F1F5F9',
        },
        border: {
          DEFAULT: '#E2E8F0',
        },
        'text-primary': '#0F172A',
        'text-secondary': '#64748B',
        'text-muted': '#94A3B8',
        success: {
          DEFAULT: '#16A34A',
          light: '#DCFCE7',
        },
        warning: {
          DEFAULT: '#D97706',
          light: '#FEF3C7',
        },
        danger: {
          DEFAULT: '#DC2626',
          light: '#FEE2E2',
        },
        info: {
          DEFAULT: '#2563EB',
          light: '#DBEAFE',
        },
        // Dark mode
        dark: {
          bg: '#0F172A',
          surface: '#1E293B',
          'surface-alt': '#334155',
          border: '#475569',
        },
      },
      // ── Typography ─────────────────────────────────────────────────────
      fontFamily: {
        sans: ['var(--font-plus-jakarta)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'page-heading': ['2rem', { lineHeight: '1.2', fontWeight: '700' }],
        'section-title': ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }],
        'card-title': ['1.125rem', { lineHeight: '1.4', fontWeight: '600' }],
        body: ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        caption: ['0.75rem', { lineHeight: '1.4', fontWeight: '400' }],
        'table-header': ['0.8125rem', { lineHeight: '1.3', fontWeight: '600' }],
      },
      // ── Spacing (4px base) ─────────────────────────────────────────────
      spacing: {
        'card-padding': '1.5rem', // 24px
        'section-gap': '2rem', // 32px
        'element-gap': '1rem', // 16px
      },
      // ── Layout ─────────────────────────────────────────────────────────
      width: {
        sidebar: '240px',
        'sidebar-collapsed': '64px',
      },
      height: {
        header: '64px',
      },
      maxWidth: {
        content: '1400px',
      },
      // ── Animations ─────────────────────────────────────────────────────
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'skeleton-pulse': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        'toast-in': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in-left': 'slide-in-left 0.3s ease-out',
        'skeleton-pulse': 'skeleton-pulse 1.5s ease-in-out infinite',
        'toast-in': 'toast-in 0.3s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
