import { defineConfig } from 'vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig({
  root: 'src/ai/log',
  plugins: [cssInjectedByJsPlugin()],
  build: {
    outDir: '../../../dist',
    emptyOutDir: false,
    lib: {
      entry: 'main.ts',
      name: 'ui5TestRunnerLogViewer',
      formats: ['iife'],
      fileName: () => 'ui5-test-runner-log-viewer.js'
    },
    rollupOptions: {
      output: {
        extend: true
      }
    },
    minify: 'terser',
    cssCodeSplit: false
  },
  server: {
    open: '/log-viewer.html'
  }
});
