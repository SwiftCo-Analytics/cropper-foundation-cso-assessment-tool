import type { Config } from 'tailwindcss';
import formsPlugin from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cropper: {
          green: {
            '50': '#f0fdf4',
            '100': '#dcfce7',
            '200': '#bbf7d0',
            '300': '#86efac',
            '400': '#4ade80',
            '500': '#22c55e',
            '600': '#16a34a',
            '700': '#15803d',
            '800': '#166534',
            '900': '#14532d',
          },
          mint: {
            '50': '#f0fdfa',
            '100': '#ccfbf1',
            '200': '#99f6e4',
            '300': '#5eead4',
            '400': '#2dd4bf',
            '500': '#14b8a6',
            '600': '#0d9488',
            '700': '#0f766e',
            '800': '#115e59',
            '900': '#134e4a',
          },
          blue: {
            '50': '#eff6ff',
            '100': '#dbeafe',
            '200': '#bfdbfe',
            '300': '#93c5fd',
            '400': '#60a5fa',
            '500': '#3b82f6',
            '600': '#2563eb',
            '700': '#1d4ed8',
            '800': '#1e40af',
            '900': '#1e3a8a',
          },
          brown: {
            '50': '#fdf8f6',
            '100': '#f2e8e5',
            '200': '#eaddd7',
            '300': '#e0cec7',
            '400': '#d2bab0',
            '500': '#bfa094',
            '600': '#a18072',
            '700': '#977669',
            '800': '#846358',
            '900': '#43302b',
          },
        },
        'cropper-green': {
          '50': '#f0fdf4',
          '100': '#dcfce7',
          '200': '#bbf7d0',
          '300': '#86efac',
          '400': '#4ade80',
          '500': '#22c55e',
          '600': '#16a34a',
          '700': '#15803d',
          '800': '#166534',
          '900': '#14532d',
        },
        'cropper-blue': {
          '50': '#f0f9ff',
          '100': '#e0f2fe',
          '200': '#bae6fd',
          '300': '#7dd3fc',
          '400': '#38bdf8',
          '500': '#0ea5e9',
          '600': '#0284c7',
          '700': '#0369a1',
          '800': '#075985',
          '900': '#0c4a6e',
        },
        'cropper-brown': {
          '50': '#fdf8f6',
          '100': '#f2e8e5',
          '200': '#eaddd7',
          '300': '#e0cec7',
          '400': '#d2bab0',
          '500': '#bfa094',
          '600': '#a18072',
          '700': '#977669',
          '800': '#846358',
          '900': '#43302b',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)'],
        mono: ['var(--font-geist-mono)'],
      },
      keyframes: {
        'fade-in-out': {
          '0%': { opacity: '0', transform: 'translateY(-1rem)' },
          '10%': { opacity: '1', transform: 'translateY(0)' },
          '90%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(-1rem)' },
        },
      },
      animation: {
        'fade-in-out': 'fade-in-out 3s ease-in-out',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [
    formsPlugin,
    typography,
  ],
};

export default config; 