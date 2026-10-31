/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#EDF2F7', card: '#F8FAFC', ink: '#18181B', mute: '#64748B', line: '#DCE4EC',
        receita: '#047857', despesa: '#B45359', violet: '#594E90', pink: '#985A80', amber: '#A16207',
      },
      fontFamily: {
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
    },
    boxShadow: { panel: '0 1px 2px rgba(24, 24, 27, .035), 0 8px 24px rgba(24, 24, 27, .035)' },
  },
  plugins: [],
};
