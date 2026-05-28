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
        exclude: [ ...exclude, 'src/agent/**', 'src/ui/**', 'src/**/ui/**' ],
        name: { label: 'shell', color: 'green' },
        environment: 'node',
        setupFiles: [ 'src/platform/mock.ts' ]
      }
    }, {
      extends: true,
      test: {
        include: [ 'src/agent/**/*.spec.ts' ],
        name: { label: 'agent', color: 'blue' },
        environment: 'jsdom',
        server: {
          deps: {
            inline: ['qunit'] // run through Vite, not Node's require cache
          }
        }        
      }
    }, {
      extends: true,
      test: {
        include: [ 'src/ui/**/*.spec.ts', 'src/**/ui/**/*.spec.ts' ],
        name: { label: 'UIs', color: 'yellow' },
        environment: 'jsdom'
      }
    }]
  }
});
