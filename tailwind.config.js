/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nijiko: {
          blue: '#87CEEB',
          light: '#F0F8FF',
        }
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}