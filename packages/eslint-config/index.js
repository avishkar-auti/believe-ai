// @ts-check
const js = require("@eslint/js");
const tseslint = require("typescript-eslint");
const prettier = require("eslint-config-prettier");

/** Base shared ESLint flat config for believe.ai packages/apps. */
module.exports = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**", ".turbo/**"],
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];
