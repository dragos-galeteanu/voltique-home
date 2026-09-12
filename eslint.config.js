const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');
const simpleImportSort = require('eslint-plugin-simple-import-sort');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: [
      'node_modules/**',
      'ios/**',
      'android/**',
      '.expo/**',
      'dist/**',
      'coverage/**',
      // Generated from the OpenAPI contract by `npm run codegen`; Prettier still formats it.
      'src/api/generated/**',
    ],
  },
  {
    plugins: { 'simple-import-sort': simpleImportSort },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      // i18next exports both a default instance and same-named functions, which makes
      // this rule fire on correct code such as i18next.use() and i18next.changeLanguage().
      'import/no-named-as-default-member': 'off',
    },
  },
  {
    // Build scripts report to the terminal; that is their output, not a stray log.
    // Flat config is order sensitive, so this has to come after the block above.
    files: ['scripts/**'],
    rules: { 'no-console': 'off' },
  },
]);
