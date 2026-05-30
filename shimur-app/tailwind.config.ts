import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        stone: {
          DEFAULT: '#C8B89A',
          dark: '#8B7355',
          light: '#EDE0CC',
        },
        ink: {
          DEFAULT: '#1A1410',
          soft: '#3D3228',
        },
        parchment: {
          DEFAULT: '#F7F0E3',
          deep: '#EDE3D0',
        },
        rust: {
          DEFAULT: '#8B3A1E',
          light: '#C4582A',
        },
        sage: {
          DEFAULT: '#4A5C45',
          light: '#7A9174',
        },
      },
      fontFamily: {
        sans: ['var(--font-heebo)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-playfair)', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
