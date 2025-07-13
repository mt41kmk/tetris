/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // テトリスカラー
        'tetris-cyan': '#00F0F0',
        'tetris-blue': '#0000F0',
        'tetris-orange': '#F0A000',
        'tetris-yellow': '#F0F000',
        'tetris-green': '#00F000',
        'tetris-purple': '#A000F0',
        'tetris-red': '#F00000',
      },
    },
    // グレースケールを直接テーマに追加
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      gray: {
        50: '#F9FAFB',
        100: '#F3F4F6',
        200: '#E5E7EB',
        300: '#D1D5DB',
        400: '#9CA3AF',
        500: '#6B7280',
        600: '#4B5563',
        700: '#343A40',
        800: '#2F363D',
        900: '#111827',
      },
    },
  },
  plugins: [],
}