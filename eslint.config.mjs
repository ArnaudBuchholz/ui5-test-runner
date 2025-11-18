import base from './eslint.base.mjs';
import globals from 'globals';

export default [
  {
    ignores: ['test/**/*.*']
  },
  ...base,
  {
    files: ['src/*.js', 'eslint.base.mjs', 'build/*'],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  },
  // Need to disable this rule because tests are built with an external function
  {
    files: ['src/configuration/validators/**.ts'],
    rules: {
      'sonarjs/no-empty-test-file': 'off'
    }
  },
  // These modules are designed to be used in a browser
  {
    files: ['src/inject/**.ts'],
    languageOptions: {
      globals: {
        ...globals.browser
      }
    },
    rules: {
      'unicorn/prefer-global-this': 'off'
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
  }
];
