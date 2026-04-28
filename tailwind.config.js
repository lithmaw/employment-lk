/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./public/**/*.html', './index.html'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          light: '#f3f4f6',
          surface: '#ffffff',
          gray: '#f9fafb',
          border: '#e5e7eb',
          lime: '#caff33',
          limedark: '#b8eb2e',
        },
      },
      keyframes: {
        fadeUp: {
          from: {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.5s ease both',
        fadeUpFast: 'fadeUp 0.4s ease both',
      },
    },
  },
  plugins: [],
};
