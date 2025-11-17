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
  {
    files: ['src/configuration/validators/**.ts'],
    rules: {
      'sonarjs/no-empty-test-file': 'off'
    }
  },
  {
    files: ['src/inject/**.ts'],
    rules: {
      'unicorn/prefer-global-this': 'off'
    }
  }
];
