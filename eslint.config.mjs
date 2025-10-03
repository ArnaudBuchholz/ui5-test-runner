import base from './eslint.base.mjs';
import globals from 'globals';

export default [
  ...base,
  {
    files: ['src/*.js', 'eslint.base.mjs'],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  }
];
