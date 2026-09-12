// Functional-programming lint profile.
//
// Kept separate from the repository's primary ESLint config so it can be
// tightened independently without destabilising the existing lint gate.
//
//   npx eslint -c eslint.fp.config.mjs .
//
// Requires: eslint, typescript-eslint, eslint-plugin-functional
//
// Encodes the house rules: immutable values, pure transformations, typed errors,
// effects pushed outward, illegal states excluded by types. React and JSX are
// prohibited outright.

import tseslint from 'typescript-eslint';
import functional from 'eslint-plugin-functional';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**', '**/dist/**', '**/build/**', '**/out/**',
      '**/*.d.ts', '**/*.test.ts', '**/*.spec.ts', '**/__tests__/**',
    ],
  },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.mts', '**/*.cts'],
    plugins: { functional },
    rules: {
      // ---- immutable values -------------------------------------------
      'prefer-const': 'error',
      'no-var': 'error',
      'functional/no-let': ['warn', { allowInForLoopInit: false }],
      'functional/immutable-data': ['warn', {
        ignoreClasses: true,
        ignoreImmediateMutation: true,
      }],

      // ---- pure transformations ---------------------------------------
      'functional/no-loop-statements': 'warn',
      'no-param-reassign': ['error', { props: true }],

      // ---- typed errors -----------------------------------------------
      'functional/no-throw-statements': ['warn', { allowToRejectPromises: true }],

      // ---- explicit inputs and outputs --------------------------------
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // ---- illegal states excluded by types ----------------------------
      'default-case-last': 'error',
      eqeqeq: ['error', 'always'],

      // ---- effects pushed outward -------------------------------------
      'no-console': 'warn',

      // ---- house prohibition -------------------------------------------
      'no-restricted-imports': ['error', {
        paths: [
          { name: 'react', message: 'React/JSX is prohibited. Use Leptos/Dioxus islands, Maud+HTMX, or Flutter/Dart.' },
          { name: 'react-dom', message: 'React/JSX is prohibited.' },
          { name: 'preact', message: 'React-style virtual DOM is prohibited.' },
        ],
      }],
    },
  },
);
