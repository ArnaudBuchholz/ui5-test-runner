import base from './eslint.base.mjs';
import globals from 'globals';

export default [
  {
    ignores: ['test/**/*.*']
  },
  ...base,
  {
    files: ['src/*.js', 'eslint.base.mjs', 'build/*', 'src/platform/js2ts.mjs'],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  },
  {
    rules: {
      'unicorn/name-replacements': [
        'error',
        {
          allowList: {
            ZLib: true,
            Configuration: true,
            configuration: true
          }
        }
      ]
    }
  },
  // Need to disable this rule because tests are built with an external function
  {
    files: ['src/configuration/validators/**.ts', 'src/**/*.test.ts'],
    rules: {
      'sonarjs/no-empty-test-file': 'off'
    }
  },
  // These modules are designed to be used in a browser
  {
    files: ['src/agent/**/*.ts', 'src/ui/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.browser
      }
    },
    rules: {
      'unicorn/prefer-global-this': 'off',
      'unicorn/prefer-iterator-to-array': 'off'
    }
  },
  // TODO implement a regexp validator
  {
    files: ['src/configuration/validators/regexp.ts'],
    rules: {
      'security/detect-non-literal-regexp': 'off'
    }
  },
  // TODO may disappear
  {
    files: ['src/cli.ts'],
    rules: {
      'unicorn/prefer-top-level-await': 'off'
    }
  },
  {
    files: ['**/*.spec.ts'],
    rules: {
      // unbound methods in spec files are common due to mocking
      '@typescript-eslint/unbound-method': 'off',
      // Math.random is enough in spec files
      'sonarjs/pseudo-random': 'off',
      // Parameterized tests are used when useful
      'sonarjs/parameterized-tests': 'off'
    }
  },
  // *Must* use any
  {
    files: ['src/platform/Exit.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off'
    }
  },
  // Build tools
  {
    files: ['build/*.mjs'],
    rules: {
      'security/detect-unsafe-regex': 'off',
      'sonarjs/slow-regex': 'off'
    }
  },
  // Relax some rules for UI code
  {
    files: ['src/ui/**/*.ts'],
    rules: {
      '@typescript-eslint/no-base-to-string': 'off'
    }
  },
  // Exceptions for unicorn/no-this-outside-of-class
  {
    files: [
      'src/modes/test/pageTask.ts',
      'src/configuration/ConfigurationValidator.ts',
      'src/platform/Process.spec.ts',
      'src/utils/shared/parallelize.spec.ts'
    ],
    rules: {
      'unicorn/no-this-outside-of-class': 'off'
    }
  }
];
