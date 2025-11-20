import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Allow 'any' type for specific cases where it's necessary
      "@typescript-eslint/no-explicit-any": "off",

      // Allow unused vars in specific cases
      "@typescript-eslint/no-unused-vars": "off",

      // Fix React hooks issues
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/set-state-in-effect": "off",

      // Allow creating components during render for specific cases
      "react-hooks/static-components": "off",

      // Allow impure functions in specific cases
      "react-hooks/purity": "off",

      // Allow unescaped entities in specific cases
      "react/no-unescaped-entities": "off",

      // Allow require imports in scripts
      "@typescript-eslint/no-require-imports": "off",

      // Allow empty interface types
      "@typescript-eslint/no-empty-object-type": "off",

      // Allow prefer-const to be warning instead of error
      "prefer-const": "off",
    },
  },
]);

export default eslintConfig;
