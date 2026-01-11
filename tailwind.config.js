/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand colors - rustic sage green, farm-to-table inspired
        primary: {
          50: '#f6f7f4',
          100: '#e8ebe3',
          200: '#d4dac9',
          300: '#b5c0a4',
          400: '#95a47e',
          500: '#7a8b62',
          600: '#5f6d4b',
          700: '#4a5639',
          800: '#3d4630',
          900: '#343c2a',
        },
        // Secondary accent - terracotta/burnt sienna, farmers market warmth
        accent: {
          50: '#fdf6f3',
          100: '#fce8e0',
          200: '#f9d4c5',
          300: '#f4b69e',
          400: '#ec8e6d',
          500: '#e2684a',
          600: '#cd4f35',
          700: '#ab3f2b',
          800: '#8c3628',
          900: '#743126',
        },
        // Warm neutrals - cream, oatmeal, grandma's kitchen
        warm: {
          50: '#fdfcf9',
          100: '#faf6ef',
          200: '#f5ede0',
          300: '#ece0cc',
          400: '#deccae',
          500: '#c9b48e',
          600: '#b09770',
          700: '#927a58',
          800: '#78644a',
          900: '#5a4a38',
        },
        // Semantic colors - earthy tones
        success: {
          light: '#e8ebe3',
          DEFAULT: '#5f6d4b',
          dark: '#4a5639',
        },
        warning: {
          light: '#fdf6e3',
          DEFAULT: '#c9a227',
          dark: '#a07d1c',
        },
        error: {
          light: '#fce8e0',
          DEFAULT: '#cd4f35',
          dark: '#8c3628',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 40px -15px rgba(0, 0, 0, 0.1)',
        'button': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'nav': '0 -1px 10px rgba(0, 0, 0, 0.1)',
      },
      borderRadius: {
        'card': '1rem',
        'card-lg': '1.5rem',
        'card-xl': '2rem',
      },
      keyframes: {
        'slide-down': {
          '0%': { transform: 'translate(-50%, -100%)', opacity: '0' },
          '100%': { transform: 'translate(-50%, 0)', opacity: '1' },
        },
      },
      animation: {
        'slide-down': 'slide-down 0.3s ease-out',
      },
    },
  },
  plugins: [],
};