import * as esbuild from "esbuild";
import { readFileSync, writeFileSync } from "fs";

esbuild.buildSync({
  entryPoints: ["gas/src/main.ts"],
  bundle: true,
  outfile: "gas/dist/Code.js",
  format: "iife",
  globalName: "_gas",
  platform: "neutral",
  target: "es2020",
  tsconfig: "tsconfig.json",
});

// Append global function declarations so GAS can find doGet and createSecret
const code = readFileSync("gas/dist/Code.js", "utf8");
const exports = `
// Expose GAS entry points as global functions
function doGet(e) { return _gas.doGet(e); }
function createSecret(payload) { return _gas.createSecret(payload); }
function cleanupExpired() { return _gas.cleanupExpired(); }
`;
writeFileSync("gas/dist/Code.js", code + exports);

console.log("GAS bundle built → gas/dist/Code.js");
