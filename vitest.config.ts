import { defineConfig, configDefaults } from 'vitest/config';

const exclude = [...configDefaults.exclude, 'src/**/*.js', 'src/**/*.test.ts', 'test/**', 'e2e/**'];

export default defineConfig({
  test: {
    exclude,
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
        exclude: [ ...exclude, 'src/agent/**' ],
        name: { label: 'node.js', color: 'green' },
        environment: 'node',
        setupFiles: [ 'src/platform/mock.ts' ]
      }
    }, {
      extends: true,
      test: {
        include: [ 'src/agent/**/*.spec.ts' ],
        name: { label: 'browser', color: 'blue' },
        environment: 'jsdom'
      }
    }]
  }
});
