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
  }
];
