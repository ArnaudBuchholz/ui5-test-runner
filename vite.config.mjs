import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/agent/index.ts',
      name: 'ui5TestRunnerAgent',
      formats: ['iife'],
      fileName: () => 'ui5-test-runner-agent.js'
    },
    outDir: 'dist',
    esmUnused: true,
    minify: 'terser',
    sourcemap: false
  },
  resolve: {
    extensions: ['.ts', '.js', '.mjs']
  }
});
