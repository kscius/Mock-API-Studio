import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      exclude: [
        'node_modules/**',
        'src/test/**',
        'src/api/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/**',
        'dist/**',
      ],
      thresholds: {
        branches: 58,
        functions: 60,
        lines: 59,
        statements: 58,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

