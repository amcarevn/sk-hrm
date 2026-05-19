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
          50: '#EEF4FB',
          100: '#D4E5F8',
          200: '#A9CCF1',
          300: '#70A9E3',
          400: '#3B85D1',
          500: '#1B65B8',
          600: '#144EA8',
          700: '#0F3A88',
          800: '#0C2870',
          900: '#081B54',
          950: '#040E35',
        },
        // SK Dental Clinic brand colors
        sk: {
          green:       '#4E9A2E', // primary brand, buttons, logo
          'green-dark':'#3F7F25', // hover, active
          'green-light':'#6FBF4A', // highlight, light background
          border:      '#E0E0E0', // divider, border
          'bg-section':'#F5F5F5', // section background
          text:        '#222222', // main text
          'text-sub':  '#666666', // subtitle, description
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
