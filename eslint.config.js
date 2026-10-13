'use strict';

const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: {
      'no-unused-vars': 'error',
      'no-console': 'off',
      eqeqeq: 'error',
      strict: ['error', 'global'],
    },
  },
];

<!-- dev B $(date -u +%T) -->
