import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Arch-Viz/',
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
