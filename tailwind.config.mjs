import plugin from 'tailwindcss/plugin'

const spacing = {
  0: '0px',
  1: '0.25rem', // 4px
  2: '0.5rem', // 8px
  3: '0.75rem', // 12px
  4: '1rem', // 16px
  6: '1.5rem', // 24px
  8: '2rem', // 32px
  10: '2.5rem', // 40px
  12: '3rem' // 48px
}

const sizeScale = {
  px: '1px',
  ...Object.fromEntries(
    Array.from({ length: 97 }, (_, i) => [i, i === 0 ? '0px' : `${i * 0.25}rem`])
  )
}

const fontSizeScale = {
  h1: ['24px', { lineHeight: '32px', fontWeight: '600' }],
  h2: ['20px', { lineHeight: '28px', fontWeight: '600' }],
  h3: ['16px', { lineHeight: '24px', fontWeight: '600' }],
  body: ['16px', { lineHeight: '24px', fontWeight: '400' }],
  meta: ['12px', { lineHeight: '16px', fontWeight: '400' }],
  xs: ['12px', { lineHeight: '16px' }],
  sm: ['12px', { lineHeight: '16px' }],
  base: ['16px', { lineHeight: '24px' }],
  lg: ['20px', { lineHeight: '28px' }],
  xl: ['24px', { lineHeight: '32px' }],
  '2xl': ['24px', { lineHeight: '32px' }],
  '3xl': ['24px', { lineHeight: '32px' }],
  '4xl': ['24px', { lineHeight: '32px' }],
  '5xl': ['24px', { lineHeight: '32px' }],
  '6xl': ['24px', { lineHeight: '32px' }]
}

const radiusScale = {
  none: '0px',
  sm: 'var(--radius)',
  md: 'var(--radius)',
  lg: 'var(--radius)',
  xl: 'var(--radius-card)',
  '2xl': 'var(--radius-card)',
  '3xl': 'var(--radius-card)',
  full: 'var(--radius-chip)',
  card: 'var(--radius-card)',
  chip: 'var(--radius-chip)',
  DEFAULT: 'var(--radius)'
}

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem', // 32px -> OK (8 * 4)
      screens: {
        '2xl': '1400px'
      }
    },
    spacing,
    fontSize: fontSizeScale,
    borderRadius: radiusScale,
    width: {
      auto: 'auto',
      ...sizeScale,
      full: '100%',
      min: 'min-content',
      max: 'max-content',
      fit: 'fit-content',
      screen: '100vw'
    },
    minWidth: {
      ...sizeScale,
      full: '100%',
      min: 'min-content',
      max: 'max-content',
      fit: 'fit-content'
    },
    maxWidth: ({ theme, breakpoints }) => ({
      none: 'none',
      0: '0px',
      xs: '20rem',
      sm: '24rem',
      md: '28rem',
      lg: '32rem',
      xl: '36rem',
      '2xl': '42rem',
      '3xl': '48rem',
      '4xl': '56rem',
      '5xl': '64rem',
      '6xl': '72rem',
      '7xl': '80rem',
      full: '100%',
      min: 'min-content',
      max: 'max-content',
      fit: 'fit-content',
      prose: '65ch',
      ...sizeScale,
      ...breakpoints(theme('screens'))
    }),
    height: {
      auto: 'auto',
      ...sizeScale,
      full: '100%',
      screen: '100vh'
    },
    minHeight: {
      ...sizeScale,
      full: '100%',
      screen: '100vh'
    },
    maxHeight: {
      none: 'none',
      ...sizeScale,
      full: '100%',
      screen: '100vh'
    },
    size: {
      ...sizeScale
    },
    extend: {
      // ==== COLORS (unchanged, driven by CSS variables) ====
      colors: {
        border: 'var(--color-border)',
        input: 'var(--color-input)',
        ring: 'var(--color-ring)',
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        primary: {
          DEFAULT: 'var(--color-primary)',
          foreground: 'var(--color-primary-foreground)'
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          foreground: 'var(--color-secondary-foreground)'
        },
        destructive: {
          DEFAULT: 'var(--color-destructive)',
          foreground: 'var(--color-destructive-foreground)'
        },
        muted: {
          DEFAULT: 'var(--color-muted)',
          foreground: 'var(--color-muted-foreground)'
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          foreground: 'var(--color-accent-foreground)'
        },
        popover: {
          DEFAULT: 'var(--color-popover)',
          foreground: 'var(--color-popover-foreground)'
        },
        card: {
          DEFAULT: 'var(--color-card)',
          foreground: 'var(--color-card-foreground)'
        },
        sidebar: {
          DEFAULT: 'var(--color-sidebar)',
          foreground: 'var(--color-sidebar-foreground)',
          primary: 'var(--color-sidebar-primary)',
          'primary-foreground': 'var(--color-sidebar-primary-foreground)',
          accent: 'var(--color-sidebar-accent)',
          'accent-foreground': 'var(--color-sidebar-accent-foreground)',
          border: 'var(--color-sidebar-border)',
          ring: 'var(--color-sidebar-ring)'
        }
      },

      // ==== MOTION (shadcn defaults, OK) ====
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      }
    }
  },
  plugins: [plugin]
}
