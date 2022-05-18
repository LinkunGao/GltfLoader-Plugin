import typescript from "@rollup/plugin-typescript";
import { terser } from "rollup-plugin-terser";
import sourcemaps from "rollup-plugin-sourcemaps";

export default {
  input: "src/index.ts",
  output: [
    {
      file: "dist/bundle.esm.js",
      format: "esm",
    },
    {
      file: "dist/bundle.umd.js",
      format: "umd",
      name: "Copper",
    },
  ],
  plugins: [typescript(), terser(), sourcemaps()],
};
