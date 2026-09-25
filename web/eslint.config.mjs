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
    // Runtime Deno separato (Supabase Edge Functions): tipi e globals
    // diversi da Next.js/Node, non fa parte del progetto TypeScript qui.
    "supabase/functions/**",
  ]),
]);

export default eslintConfig;
