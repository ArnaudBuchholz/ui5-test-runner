import { defineConfig } from 'vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import { importMetaTransform } from '../vite.config.shared.mjs';

export default defineConfig({
  root: 'src/ui/lib',
  plugins: [cssInjectedByJsPlugin()],
  build: {
    outDir: '../../../dist/ui',
    emptyOutDir: false,
    lib: {
      entry: 'index.ts',
      name: 'ui5TestRunnerLib',
      formats: ['iife'],
      fileName: () => 'lib.js'
    },
    rollupOptions: importMetaTransform,
    minify: 'terser'
  }
});
