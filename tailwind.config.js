/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      screens: {
        xs: '0px',
        sm: '640px',
        md: '768px',
        lg: '1100px',
        xl: '1280px',
      },
      extend: {},
    },
    plugins: [],
  }