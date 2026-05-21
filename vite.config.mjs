import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/agent/index.ts',
      name: 'ui5TestRunnerAgent',
      formats: ['iife'],
      fileName: () => 'agent.js'
    },
    outDir: 'dist/ui',
    esmUnused: true,
    minify: 'terser',
    sourcemap: false
  },
  resolve: {
    extensions: ['.ts', '.js', '.mjs']
  }
});
