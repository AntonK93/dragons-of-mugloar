import eslint from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default [
    {
        ignores: ["dist/**", "node_modules/**"],
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ["**/*.{ts,tsx}"],
        rules: {
            "@typescript-eslint/naming-convention": [
                "error",
                { selector: ["variable", "function"], format: ["camelCase", "UPPER_CASE"] },
                { selector: "parameter", format: ["camelCase"], leadingUnderscore: "allow" },
                { selector: "typeLike", format: ["PascalCase"] },
            ],
        },
    },
    {
        files: ["src/**/*.tsx"],
        rules: {
            "@typescript-eslint/naming-convention": [
                "error",
                {
                    selector: ["variable", "function"],
                    format: ["camelCase", "PascalCase", "UPPER_CASE"],
                },
                { selector: "parameter", format: ["camelCase"], leadingUnderscore: "allow" },
                { selector: "typeLike", format: ["PascalCase"] },
            ],
        },
    },
    {
        files: ["src/**/*.{ts,tsx}"],
        plugins: {
            "react-hooks": reactHooks,
            "react-refresh": reactRefresh,
        },
        rules: {
            "react-hooks/rules-of-hooks": "error",
            "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
        },
    },
    {
        plugins: {
            "@stylistic": stylistic,
        },
        rules: {
            "@stylistic/indent": ["error", 4],
            "@stylistic/indent-binary-ops": ["error", 4],
            "@stylistic/max-len": ["error", { code: 100 }],
            "@stylistic/no-multi-spaces": "error",
            "@stylistic/no-trailing-spaces": "error",
        },
    },
    prettierRecommended,
    {
        rules: {
            "prettier/prettier": ["error", { printWidth: 100, tabWidth: 4 }],
            "@stylistic/max-len": ["error", { code: 100 }],
        },
    },
];
