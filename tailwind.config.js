/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50:  '#F0F7F0',
          100: '#D4EDD4',
          200: '#A9DBA9',
          300: '#72C272',
          400: '#4CA84C',
          500: '#2E7A2E',
          600: '#266426',
          700: '#1D4E1D',
          800: '#153915',
          900: '#0D240D',
          950: '#061206',
        },
        sk: {
          green:        '#2E7A2E',
          'green-hover':'#266426',
          'green-light':'#72C272',
          'green-pale': '#F0F7F0',
          border:       '#E0E0E0',
          'bg-section': '#F5F5F5',
          text:         '#222222',
          'text-sub':   '#666666',
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-out forwards',
        slideUp: 'slideUp 0.3s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};
