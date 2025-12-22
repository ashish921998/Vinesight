import plugin from 'tailwindcss/plugin'

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
        }
      },

      // ==== RADII (4pt grid + chip exception) ====
      // You should define --radius in CSS as 8px to keep it on 4pt grid:
      // :root { --radius: 8px; --radius-card: 12px; --radius-chip: 999px; }
      borderRadius: {
        // cards use 12px
        card: 'var(--radius-card)',

        // buttons / inputs / general rounded corners = 8px
        lg: 'var(--radius)',

        // smaller elements = 4px (radius - 4px)
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 4px)',

        // chips / pills explicit exception
        chip: 'var(--radius-chip)' // 999px in CSS var
      },

      // ==== TYPOGRAPHY TOKENS (VineSight scale) ====
      // [fontSize, { lineHeight, fontWeight }]
      fontSize: {
        h1: ['24px', { lineHeight: '32px', fontWeight: '600' }], // Page titles
        h2: ['20px', { lineHeight: '28px', fontWeight: '600' }], // Section headers
        h3: ['16px', { lineHeight: '24px', fontWeight: '600' }], // Card titles
        body: ['16px', { lineHeight: '24px', fontWeight: '400' }], // Default body
        meta: ['12px', { lineHeight: '16px', fontWeight: '400' }] // Labels, dates
      },

      // ==== SPACING TOKENS (4pt grid) ====
      // Tailwind base: 1 = 0.25rem = 4px
      // Here we only emphasize the ones your system uses.
      spacing: {
        1: '0.25rem', // 4px  (XS)
        2: '0.5rem', // 8px  (SM)
        4: '1rem', // 16px (MD)
        6: '1.5rem', // 24px (LG)
        8: '2rem', // 32px (XL)
        10: '2.5rem', // 40px (XXL)
        12: '3rem' // 48px (XXXL)
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
