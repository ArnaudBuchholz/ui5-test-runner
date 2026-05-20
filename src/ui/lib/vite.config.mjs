import { defineConfig } from 'vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig({
  root: 'src/ui/lib',
  plugins: [cssInjectedByJsPlugin()],
  build: {
    outDir: '../../../dist',
    emptyOutDir: false,
    lib: {
      entry: 'index.ts',
      name: 'ui5TestRunnerLib',
      formats: ['iife'],
      fileName: () => 'ui5-test-runner-lib.js'
    },
    rollupOptions: {
      transform: {
        define: {
          'import.meta': '{}'
        }
      }
    },
    minify: 'terser'
  }
});
