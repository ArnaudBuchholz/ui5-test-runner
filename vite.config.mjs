import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, 'src/**/*.js', 'test/**', 'e2e/**'],
    coverage: {
      exclude: ['dist/**', 'eslint.config.mjs', 'vite.config.mjs', 'src/**/*.spec.ts', 'src/**/index.ts']
    }
  }
});
