import { defineConfig } from 'vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export const importMetaTransform = {
  transform: {
    define: {
      'import.meta': '{}'
    }
  }
};

export const dropLibraryPlugin = {
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

export function createAppConfig({ root, name, fileName, serverOpen }) {
  return defineConfig({
    root,
    plugins: [dropLibraryPlugin, cssInjectedByJsPlugin()],
    build: {
      outDir: '../../../dist/ui',
      emptyOutDir: false,
      lib: {
        entry: 'main.ts',
        name,
        formats: ['iife'],
        fileName: () => fileName
      },
      rollupOptions: {
        ...importMetaTransform,
        output: {
          extend: true
        }
      },
      minify: 'terser',
      cssCodeSplit: false
    },
    server: {
      open: serverOpen
    }
  });
}
