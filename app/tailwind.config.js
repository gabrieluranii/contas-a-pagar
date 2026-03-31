/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg:       '#0f0f0f',
        surface:  '#1a1a1a',
        surface2: '#242424',
        border:   '#2e2e2e',
        border2:  '#3a3a3a',
        text:     '#e8e4df',
        text2:    '#a09b94',
        text3:    '#6b6560',
        accent:   '#4a9e6a',
        'accent-light': '#1a2e22',
        'accent-text':  '#6fcf8a',
        danger:   '#cf5555',
        'danger-light': '#2e1a1a',
        warning:  '#c9961a',
        'warning-light': '#2e2410',
        info:     '#5a9ad5',
        'info-light': '#1a2436',
        orange:   '#E8400C',
        'nav-bg': '#161616',
      },
      fontFamily: {
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans:  ['"DM Sans"', 'sans-serif'],
      },
      width: {
        nav:      '56px',
        'nav-open': '240px',
      },
      borderRadius: {
        DEFAULT: '10px',
        lg:      '14px',
      },
    },
  },
  plugins: [],
};
