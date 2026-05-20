import { defineConfig } from 'vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

const dropLibPlugin = {
  name: 'drop-lib',
  enforce: 'pre',
  apply: 'build',
  resolveId(id) {
    if (id.startsWith('@ui5/')) return { id: '\0lib-empty', moduleSideEffects: false };
  },
  load(id) {
    if (id === '\0lib-empty') return '';
  }
};

export default defineConfig({
  root: 'src/ui/report',
  plugins: [dropLibPlugin, cssInjectedByJsPlugin()],
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
      transform: {
        define: {
          'import.meta': '{}'
        }
      },
      output: {
        extend: true
      }
    },
    minify: 'terser',
    cssCodeSplit: false
  },
  server: {
    open: '/test.html'
  }
});
