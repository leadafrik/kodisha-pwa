/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'terra': {
          50:  '#FDF5F3',
          100: '#FAE9E4',
          200: '#F3C9BE',
          300: '#E8A08E',
          400: '#D66D54',
          500: '#A0452E',
          600: '#8B3525',
          700: '#72281A',
          800: '#5A1F14',
          900: '#43170E',
        },
        'amber-sun': {
          50:  '#FFF9EC',
          100: '#FFF0C8',
          400: '#F5B942',
          500: '#E8973A',
          600: '#D07B1E',
        },
        'forest': {
          50:  '#F0FAF5',
          100: '#DCFAEC',
          500: '#27AE60',
          600: '#1A7A4A',
          700: '#145E38',
        },
        'earth':   '#FAF7F2',
        'earth-2': '#F5EFE6',
        // legacy aliases
        'kenya-green': '#27AE60',
        'kenya-black': '#000000',
        'kenya-red':   '#BB0000',
      },
      fontFamily: {
        'display': ['Fraunces', 'Georgia', 'serif'],
        'body':    ['Sora', '"Segoe UI"', 'Tahoma', 'sans-serif'],
      },
      animation: {
        'fade-in-up':  'fadeInUp 0.55s ease-out forwards',
        'fade-in-up2': 'fadeInUp 0.55s 0.14s ease-out both',
        'fade-in-up3': 'fadeInUp 0.55s 0.28s ease-out both',
        'shimmer':     'shimmer 2.8s ease-in-out infinite',
        'ticker':      'ticker 38s linear infinite',
        'pulse-slow':  'pulse 4s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(22px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
        ticker: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
}