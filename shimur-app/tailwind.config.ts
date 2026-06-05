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
        navy: {
          DEFAULT: '#1B2A4A',
          light: '#2C3E6B',
          soft: '#4A5A7A',
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
        ocean: {
          DEFAULT: '#1B6B7D',
          dark: '#0E4A58',
          light: '#2A8FA3',
          pale: '#E8F4F7',
        },
        amber: {
          DEFAULT: '#D4922A',
          dark: '#A67318',
          light: '#E8B44C',
          pale: '#FDF5E6',
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
