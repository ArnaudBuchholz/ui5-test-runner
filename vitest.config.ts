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
    projects: [{
      extends: true,
      test: {
        name: { label: 'cli', color: 'green' },
        environment: 'node',
        setupFiles: [ 'src/platform/mock.ts' ]
      }
    // }, {
    //   extends: true,
    //   test: {
    //     exclude: [ ...exclude, 'src/platform/**/*.spec.ts' ],
    //     name: { label: 'agent', color: 'blue' },
    //     environment: 'node',
    //     setupFiles: [ 'src/platform/mock.ts' ],
    //   }
    }]
  }
});
