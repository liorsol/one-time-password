import * as esbuild from "esbuild";
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

esbuild.buildSync({
  entryPoints: [join(root, "gas/src/main.ts")],
  bundle: true,
  outfile: join(root, "gas/dist/Code.js"),
  format: "iife",
  globalName: "_gas",
  platform: "neutral",
  target: "es2020",
  tsconfig: join(root, "tsconfig.json"),
});

// Append global function declarations so GAS can find entry points
const outfile = join(root, "gas/dist/Code.js");
const code = readFileSync(outfile, "utf8");
const exports = `
// Expose GAS entry points as global functions
function doGet(e) { return _gas.doGet(e); }
function createSecret(payload) { return _gas.createSecret(payload); }
function cleanupExpired() { return _gas.cleanupExpired(); }
function ensureCleanupTrigger() { return _gas.ensureCleanupTrigger(); }
`;
writeFileSync(outfile, code + exports);

console.log("GAS bundle built → gas/dist/Code.js");
