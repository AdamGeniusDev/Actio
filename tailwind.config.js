/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // ── Surfaces brutes ──────────────────────────────────────────────────
        'base':    '#080D14',
        'surface': '#0D1520',
        'card':    '#121E2E',
        'raised':  '#172436',
        'subtle':  '#1E3048',
        'strong':  '#2A4560',

        // ── Alias sémantiques (utilisés dans les composants) ─────────────────
        'background': '#080D14',   // → bg-background
        'deep':       '#0D1520',   // → bg-deep (bottom card onboarding)
        'border':     '#2A4560',   // → border-border

        // ── Tokens de texte ──────────────────────────────────────────────────
        'text': {
          'primary':   '#F0F6FF',  // → text-text-primary
          'secondary': '#8BA3BE',  // → text-text-secondary
          'muted':     '#4A6480',  // → text-text-muted
        },

        // ── Accent ───────────────────────────────────────────────────────────
        'accent': {
          DEFAULT: '#FF6B1A',
          soft:    '#FF8C42',
          glow:    'rgba(255, 107, 26, 0.15)',
          muted:   'rgba(255, 107, 26, 0.10)',
        },

        // ── Couleurs directes (Button LABEL_CLS : text-primary, etc.) ────────
        'primary':   '#F0F6FF',
        'secondary': '#8BA3BE',
        'muted':     '#4A6480',
        'ghost':     '#2A3D52',

        // ── États ────────────────────────────────────────────────────────────
        'success': { DEFAULT: '#00D68F', muted: 'rgba(0, 214, 143, 0.12)' },
        'danger':  { DEFAULT: '#FF3B5C', muted: 'rgba(255, 59, 92, 0.12)'  },
        'warning': { DEFAULT: '#FFB800', muted: 'rgba(255, 184, 0, 0.12)'  },
        'info':    { DEFAULT: '#4D9EFF', muted: 'rgba(77, 158, 255, 0.12)' },
      },

      fontFamily: {
        // ── Clash Display And Space Grotesk ─────────────────────────────────────────────────────
        'clash-bold':     ['ClashDisplay-Bold'],
        'space-bold': ['SpaceGrotesk-Bold'],
        'space-medium': ['SpaceGrotesk-Medium'],
        'space-regular': ['SpaceGrotesk-Regular'],
        // ── Inter ─────────────────────────────────────────────────────────────
        'inter-regular':  ['Inter-Regular'],
        'inter-medium':   ['Inter-Medium'],
        'inter-semibold': ['Inter-SemiBold'],
        'inter-bold':     ['Inter-Bold'],
        'inter-light':    ['Inter-Light'],
        'inter-thin':     ['Inter-Thin'],
        'inter-extralight': ['Inter-ExtraLight'],
      },

      fontSize: {
        'display-xl': ['40px', { lineHeight: '44px', letterSpacing: '-1.5px' }],
        'display-l':  ['32px', { lineHeight: '37px', letterSpacing: '-1px'   }],
        'display-m':  ['24px', { lineHeight: '29px', letterSpacing: '-0.5px' }],
        'display-s':  ['20px', { lineHeight: '25px', letterSpacing: '-0.3px' }],
        'body-l':  ['16px', { lineHeight: '24px' }],
        'body-m':  ['15px', { lineHeight: '24px' }],
        'body-s':  ['13px', { lineHeight: '20px' }],
        'label':   ['12px', { lineHeight: '16px', letterSpacing: '0.8px' }],
        'caption': ['11px', { lineHeight: '15px' }],
        'data-xl': ['72px', { lineHeight: '72px', letterSpacing: '-4px'   }],
        'data-l':  ['28px', { lineHeight: '32px', letterSpacing: '-0.5px' }],
        'data-m':  ['16px', { lineHeight: '20px' }],
        'data-s':  ['13px', { lineHeight: '16px' }],
      },

      borderRadius: {
        'xs': '6px',  'sm': '10px', 'md': '14px',
        'lg': '20px', 'xl': '24px', '2xl': '28px', 'full': '999px',
      },

      spacing: {
        'xs': '4px',  'sm': '8px',  'md': '12px', 'lg': '16px',
        'xl': '20px', '2xl': '24px', '3xl': '32px', '4xl': '40px',
        '5xl': '48px', '6xl': '64px', '7xl': '80px',
      },
    },
  },
  plugins: [],
};