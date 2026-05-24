import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals.js";

const eslintConfig = defineConfig([
  ...nextVitals,
]);

export default eslintConfig;
