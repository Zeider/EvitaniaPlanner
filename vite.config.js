import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

const preactPlugins = preact().filter(p => p.name !== 'preact:transform-hook-names');

export default defineConfig({
  plugins: preactPlugins,
  base: '/EvitaniaCalc/',
  test: {
    environment: 'jsdom',
  },
});
