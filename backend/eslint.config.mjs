import eslint from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import tseslint from "typescript-eslint";

export default [
    {
        ignores: ["dist/**", "node_modules/**"],
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ["**/*.ts"],
        rules: {
            "no-restricted-syntax": [
                "error",
                {
                    selector: "FunctionDeclaration",
                    message: "Use an arrow function outside classes.",
                },
                {
                    selector: "FunctionExpression:not([parent.type='MethodDefinition'])",
                    message: "Use an arrow function outside classes.",
                },
            ],
            "@typescript-eslint/explicit-function-return-type": [
                "error",
                {
                    allowExpressions: false,
                    allowTypedFunctionExpressions: false,
                    allowHigherOrderFunctions: false,
                    allowDirectConstAssertionInArrowFunctions: false,
                },
            ],
            "@typescript-eslint/naming-convention": [
                "error",
                { selector: ["variable", "function"], format: ["camelCase", "UPPER_CASE"] },
                { selector: "parameter", format: ["camelCase"], leadingUnderscore: "allow" },
                { selector: "typeLike", format: ["PascalCase"] },
            ],
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
