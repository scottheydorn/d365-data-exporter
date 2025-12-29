/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // New Balance Brand Colors
        'nb-red': '#E21836',
        'nb-red-dark': '#ce2724',
        'nb-yellow': '#f3ec19',
        'nb-teal': '#207c88',
        'nb-opal': '#aac1bf',
        'nb-cream': '#e8e9d7',
        'nb-gray': '#4c4d4f',
        'nb-black': '#231f20',
      },
      fontFamily: {
        // New Balance uses clean sans-serif fonts
        'sans': ['Inter', 'Helvetica Neue', 'Arial', 'sans-serif'],
        'heading': ['Inter', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
