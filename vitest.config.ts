import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, 'src/**/*.js', 'src/**/*.test.ts', 'test/**', 'e2e/**'],
    coverage: {
      exclude: [
        '**/*.js',
        'build/**',
        'dist/**',
        'eslint.*.mjs',
        'vite.config.mjs',
        'src/**/*.spec.ts',
        'src/**/index.ts',
        'test/**',
        'src/system/**'
      ]
    },
    setupFiles: [ 'src/platform/mock.ts' ]
  }
});
