import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#04040a',
        surface: '#080810',
        surface2: '#0d0d1a',
        accent: '#00ffb4',
        accent2: '#ff4af8',
        accent3: '#4af0ff',
        accent4: '#ffcc44',
        text: '#b8ccc4',
        text2: '#6a8a7a',
        dim: '#334444',
        red: '#ff4455'
      },
      fontFamily: {
        sans: ['Sora', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
        display: ['Syne', 'system-ui'],
        footerBrand: ['"Archivo Black"', 'Syne', 'system-ui', 'sans-serif'],
        jetbrains: ['"JetBrains Mono"', 'monospace']
      }
    }
  },
  plugins: []
};

export default config;

