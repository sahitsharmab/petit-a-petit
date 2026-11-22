import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// eslint-config-next 16 ships native flat configs, so FlatCompat is no longer needed.
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // New React Compiler-oriented checks added in eslint-plugin-react-hooks 7 (via eslint-config-next 16).
    // Kept visible as warnings until the affected components are refactored.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/purity": "warn",
    },
  },
  globalIgnores([".next/**", "node_modules/**", "drizzle/**", "next-env.d.ts", "test-results/**", "playwright-report/**"]),
]);
