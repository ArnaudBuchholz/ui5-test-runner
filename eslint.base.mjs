import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';
import security from 'eslint-plugin-security';
import noOnlyTests from 'eslint-plugin-no-only-tests';
import importPlugin from 'eslint-plugin-import';
import stylistic from '@stylistic/eslint-plugin';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import sonarjs from 'eslint-plugin-sonarjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: eslint.configs.recommended,
  allConfig: eslint.configs.all
});

export default [
  ...tseslint.config(eslint.configs.recommended, tseslint.configs.recommended, importPlugin.flatConfigs.recommended),
  ...tseslint.configs.recommendedTypeCheckedOnly.map((config) => ({
    ...config,
    ignores: ['**/*.spec.ts', '**/*.[cm]js', '**/*.js'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: process.cwd()
      }
    }
  })),
  ...compat.extends('plugin:prettier/recommended', 'prettier'),
  eslintPluginUnicorn.configs.recommended,
  sonarjs.configs.recommended,
  {
    plugins: {
      prettier,
      security,
      'no-only-tests': noOnlyTests,
      stylistic
    },
    languageOptions: {
      globals: {
        Proxy: false
      }
    },
    rules: {
      // prettier
      'prettier/prettier': [
        'error',
        {
          semi: true,
          singleQuote: true,
          tabWidth: 2,
          useTabs: false,
          printWidth: 120,
          trailingComma: 'none'
        }
      ],
      'no-unused-vars': 'off',
      'comma-dangle': ['error', 'never'],
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-empty-object-type': 'error',
      '@typescript-eslint/no-unsafe-function-type': 'error',
      '@typescript-eslint/no-wrapper-object-types': 'error',
      'max-len': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'separate-type-imports'
        }
      ],
      'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          ts: 'never'
        }
      ],
      'import/no-unresolved': 'off',
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      'security/detect-unsafe-regex': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-non-literal-regexp': 'error',
      'security/detect-non-literal-require': 'error',
      'security/detect-possible-timing-attacks': 'error',
      'security/detect-pseudoRandomBytes': 'error',
      'no-only-tests/no-only-tests': 'error',
      'unicorn/import-style': 'off',
      'unicorn/filename-case': [
        'error',
        {
          cases: {
            camelCase: true,
            pascalCase: true
          }
        }
      ],
      'unicorn/no-null': 'off',
      'unicorn/prefer-switch': 'off',
      'unicorn/no-empty-file': 'warn',
      'unicorn/prefer-number-properties': [
        'error',
        {
          checkInfinity: true
        }
      ],
      'unicorn/prefer-add-event-listener': 'off',
      'sonarjs/todo-tag': 'warn'
    }
  },
  {
    files: ['**/*.spec.ts'],
    rules: {
      'unicorn/consistent-function-scoping': 'off',
      'sonarjs/no-nested-functions': 'off'
    }
  },
  {
    ignores: ['dist/', 'coverage/']
  }
];
