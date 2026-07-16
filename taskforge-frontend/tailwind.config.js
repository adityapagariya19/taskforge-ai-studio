/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        border: 'var(--color-border)',
        primary: 'var(--color-primary)',
        'accent-ai': 'var(--color-accent-ai)',
        text: 'var(--color-text)',
        'text-muted': 'var(--color-text-muted)'
      }
    }
  },
  plugins: []
}
