import { defineConfig } from 'eslint/config'
import css from '@eslint/css'
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'

export default defineConfig([
    {
        ignores: ['dist/**', 'src/routeTree.gen.ts'],
    },
    {
        files: ['**/*.{ts,tsx}'],
        extends: [js.configs.recommended, ...tseslint.configs.recommended],
        plugins: { react },
        languageOptions: {
            parserOptions: {
                ecmaFeatures: { jsx: true },
            },
        },
        settings: {
            react: { version: 'detect' },
        },
        rules: {
            'react/react-in-jsx-scope': 'off',
        },
    },
    {
        files: ['**/*.css'],
        language: 'css/css',
        plugins: { css },
        extends: ['css/recommended'],
        rules: {
            'css/no-invalid-properties': 'off',
            'css/use-baseline': 'off',
        },
    },
])
