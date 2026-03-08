import { defineConfig } from 'vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig({
  root: 'src/ui/report',
  plugins: [cssInjectedByJsPlugin()],
  build: {
    outDir: '../../../dist',
    emptyOutDir: false,
    lib: {
      entry: 'main.ts',
      name: 'ui5TestRunnerReport',
      formats: ['iife'],
      fileName: () => 'ui5-test-runner-html-report.js'
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
    open: '/html-report.html'
  }
});
