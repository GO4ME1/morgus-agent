import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Allow underscore-prefixed unused vars (common pattern for intentionally unused params)
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }],
      // Disable base no-unused-vars (use TS version instead)
      'no-unused-vars': 'off',
      // Downgrade no-explicit-any to warning (too many to fix at once)
      '@typescript-eslint/no-explicit-any': 'warn',
      // Downgrade exhaustive-deps to warning (often intentional)
      'react-hooks/exhaustive-deps': 'warn',
      // Downgrade react-refresh to warning (dev-only concern)
      'react-refresh/only-export-components': 'warn',
      // Downgrade set-state-in-effect to warning - valid React patterns
      'react-hooks/set-state-in-effect': 'warn',
      // Downgrade purity to warning - sometimes necessary
      'react-hooks/purity': 'warn',
      // Downgrade immutability to warning
      'react-hooks/immutability': 'warn'
    }
  },
])
