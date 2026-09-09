const { defineConfig } = require('eslint/config');
const expo = require('eslint-config-expo/flat');
module.exports = defineConfig([
  expo,
  { files: ['tests/**'], rules: { '@typescript-eslint/no-require-imports': 'off' } },
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**'] },
]);
