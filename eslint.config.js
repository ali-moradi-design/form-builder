import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import jsdoc from "eslint-plugin-jsdoc";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
  globalIgnores(["**/dist/", "**/node_modules/", "docs/", "graphify-out/", ".turbo/"]),
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      globals: globals.node,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
  {
    // Every public export of a package must be documented with TSDoc.
    files: ["packages/*/src/**/*.ts"],
    ignores: ["**/*.test.ts"],
    extends: [jsdoc.configs["flat/recommended-typescript-error"]],
    settings: { jsdoc: { tagNamePreference: { template: "typeParam" } } },
    rules: {
      "jsdoc/require-throws-type": "off",
      "jsdoc/require-jsdoc": [
        "error",
        {
          publicOnly: true,
          require: { FunctionDeclaration: true, ClassDeclaration: true, MethodDefinition: true },
          contexts: [
            "TSInterfaceDeclaration",
            "TSTypeAliasDeclaration",
            "TSPropertySignature",
            "ExportNamedDeclaration > VariableDeclaration",
          ],
        },
      ],
      "jsdoc/tag-lines": ["error", "any", { startLines: 1 }],
      "jsdoc/require-param": "error",
      "jsdoc/require-returns": "error",
      "jsdoc/check-tag-names": [
        "error",
        { definedTags: ["since", "defaultValue", "remarks", "typeParam"] },
      ],
    },
  },
  {
    files: ["**/*.js"],
    extends: [tseslint.configs.disableTypeChecked],
  },
);
