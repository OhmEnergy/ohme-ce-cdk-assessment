import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";


/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: ["node_modules/**", "**/cdk.out/**"],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
  },
  {
    files: ["**/*.js"],
    languageOptions: { sourceType: "script" },
  },
  {languageOptions: { globals: globals.browser }},
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
];
