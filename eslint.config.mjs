import globals from 'globals';
import tslint from 'typescript-eslint';
import vueLint from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';

import jsLint from '@eslint/js';

// ESLint 同時負責 lint 與 format（不使用 Prettier）。
export default [
    { ignores: ['dist/*', '**/*.d.ts'] },

    jsLint.configs.recommended,
    ...tslint.configs.recommended,
    ...vueLint.configs['flat/recommended'],

    // vue
    {
        files: ['**/*.vue'],
        languageOptions: {
            parser: vueParser,
            parserOptions: { parser: tslint.parser },
        },
        rules: {
            'vue/html-indent': [
                'error',
                4,
                {
                    attribute: 1,
                    alignAttributesVertically: true,
                },
            ],
            'vue/multi-word-component-names': 'off',
            'vue/script-indent': [
                'error',
                4,
                { baseIndent: 0 },
            ],
            'vue/html-self-closing': [
                'error', {
                    html: {
                        void: 'never',
                        normal: 'always',
                        component: 'always',
                    },
                    svg: 'always',
                    math: 'always',
                },
            ],
        },
    },

    // all files
    {
        rules: {
            quotes: ['error', 'single'],
            semi: 'error',
            'comma-dangle': ['error', 'always-multiline'],
            'no-multiple-empty-lines': ['error', { max: 1 }],
            'object-curly-spacing': ['error', 'always'],
            'object-curly-newline': [
                'error', {
                    multiline: true,
                    minProperties: 2,
                },
            ],
            'array-bracket-newline': [
                'error', {
                    multiline: true,
                    minItems: 3,
                },
            ],
            'array-element-newline': ['error', { minItems: 3 }],
            '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-unused-vars': [
                'error', {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                },
            ],
            'no-empty': ['error', { allowEmptyCatch: false }],
        },
    },

    // indent（vue 檔由 vue/script-indent 負責）
    {
        files: ['**/*.{js,mjs,ts}'],
        rules: { indent: ['error', 4] },
    },

    { languageOptions: { globals: { ...globals.browser } } },
    {
        files: ['*.config.{ts,mjs}'],
        languageOptions: { globals: { ...globals.node } },
    },
];
