/* eslint-disable no-undef */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    fontFamily: {
      bitter: ['Bitter', 'serif'],
      inter: ['Inter', 'serif'],
    },
    colors: {
      transparent: 'rgb(0, 0, 0, 0)',
      white: '#ffffff',
      black: '#000000',
      'wave-blue': '#003d50',
      'mist-gray': '#edf1f3',
      'flamingo-pink': '#f2617a',
      'black-transparent': 'rgb(0, 0, 0, 0.2)',
      'white-transparent': 'rgb(255, 255, 255, 0.6)',
    },
  },
  plugins: [],
};
