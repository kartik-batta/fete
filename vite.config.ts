import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

/**
 * Long-lived vendor chunks. Libraries change far less often than app code, so
 * splitting them out lets browsers keep them cached across deploys.
 * (Vite 8 bundles with Rolldown, which uses `codeSplitting.groups` in place of
 * Rollup's `manualChunks`.)
 */
const VENDOR_CHUNKS = [
  {name: 'react-vendor', test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/},
  {name: 'motion', test: /[\\/]node_modules[\\/](motion|framer-motion|motion-dom|motion-utils)[\\/]/},
  {name: 'icons', test: /[\\/]node_modules[\\/]lucide-react[\\/]/},
];

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      // Evergreen browsers only: smaller output, no legacy syntax transforms.
      target: 'es2022',
      cssCodeSplit: true,
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: VENDOR_CHUNKS,
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
