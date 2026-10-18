/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

/**
 * BASE_PATH is set by the GitHub Pages workflow to "/<repo-name>/" so that asset URLs resolve on
 * https://<owner>.github.io/<repo-name>/. Locally it defaults to "/".
 */
const base = process.env.BASE_PATH || '/';

export default defineConfig(() => {
  return {
    base,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled via the DISABLE_HMR environment variable.
      // Do not modify: file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./vitest.setup.ts'],
      testTimeout: 30000,
      include: ['src/**/*.test.{ts,tsx}'],
      css: false,
      coverage: {
        provider: 'v8' as const,
        include: ['src/**/*.{ts,tsx}', 'tina/schema.ts'],
        exclude: ['src/**/*.test.{ts,tsx}', 'src/main.tsx'],
      },
    },
  };
});
