import { defineConfig, configDefaults } from 'vitest/config';
import { resolve } from 'node:path';

const exclude = [...configDefaults.exclude, 'src/**/*.js', 'src/**/*.test.ts', 'dist/**', 'test/**', 'e2e/**', '.claude/**', '.worktrees/**'];

export default defineConfig({
  test: {
    onConsoleLog: () => false,
    exclude,
    coverage: {
      include: ['src/**/*.ts'],
      exclude: [
        '**/*.js',
        'build/**',
        'dist/**',
        'eslint.*.mjs',
        'vite.config.mjs',
        'src/**/*.d.ts',
        'src/**/*.spec.ts',
        'src/**/index.ts',
        // Use absolute paths so picomatch's `contains` option doesn't match src/modes/test/
        resolve('test') + '/**',
        resolve('e2e') + '/**',
        // Generated
        'src/configuration/validations.ts',
        // AI-generated UI code — tested but excluded from coverage
        'src/ui/**',
        // Type-only files (no runtime code)
        'src/agent/Configuration.ts',
        'src/browsers/IBrowser.ts',
        'src/configuration/Configuration.ts',
        'src/configuration/Option.ts',
        'src/configuration/validators/OptionValidator.ts',
        'src/modes/batch/BatchItem.ts',
        'src/modes/log/ui/types.ts',
        'src/modes/ModeFunction.ts',
        'src/modes/test/PageContext.ts',
        'src/platform/logger/ILogger.ts',
        'src/types/IError.ts',
        'src/types/IUserInterfaceController.ts',
        'src/types/typeUtilities.ts'
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
