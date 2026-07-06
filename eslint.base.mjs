import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import security from 'eslint-plugin-security';
import noOnlyTests from 'eslint-plugin-no-only-tests';
import { flatConfigs } from 'eslint-plugin-import-x';
import stylistic from '@stylistic/eslint-plugin';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import sonarjs from 'eslint-plugin-sonarjs';

export default [
  ...tseslint.config(eslint.configs.recommended, tseslint.configs.recommended, flatConfigs.recommended),
  ...tseslint.configs.recommendedTypeCheckedOnly.map((config) => ({
    ...config,
    ignores: ['**/*.[cm]js', '**/*.js'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: process.cwd()
      }
    }
  })),
  prettierConfig,
  eslintPluginUnicorn.configs.recommended,
  sonarjs.configs.recommended,
  {
    plugins: {
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
      'no-unused-vars': 'off',
      'comma-dangle': ['error', 'never'],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_'
        }
      ],
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
      'import-x/consistent-type-specifier-style': ['error', 'prefer-top-level'],
      'import-x/extensions': [
        'error',
        'ignorePackages',
        {
          ts: 'never'
        }
      ],
      'import-x/no-unresolved': 'off',
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
      'unicorn/prefer-global-number-constants': 'off',
      'unicorn/prefer-add-event-listener': 'off',
      'unicorn/prefer-top-level-await': 'off', // causes issues when running with js2ts.mjs
      'unicorn/consistent-class-member-order': 'off', // prefer to add members close to their use
      'unicorn/no-nonstandard-builtin-properties': 'off', // Use of Symbol.dispose
      'unicorn/no-top-level-assignment-in-function': 'off',
      'unicorn/no-top-level-side-effects': 'off',
      'sonarjs/todo-tag': 'warn',
      'sonarjs/no-skipped-tests': 'warn',
      'sonarjs/no-unused-vars': 'off', // covered by @typescript-eslint/no-unused-vars
      'sonarjs/aws-restricted-ip-admin-access': 'off' // useless
    }
  },
  {
    files: ['**/*.spec.ts', '**/*.test.ts', 'src/platform/mock.ts'],
    rules: {
      'unicorn/consistent-function-scoping': 'off',
      'unicorn/no-global-object-property-assignment': 'off',
      'sonarjs/no-nested-functions': 'off'
    }
  },
  {
    ignores: ['dist/', 'coverage/']
  }
];
