#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { ensureDir, isSafePetId, pluginRoot, readJson, validatePet } = require("./pet-lib");

function main() {
  const name = process.argv[2];
  const out = process.argv[3] || `${name || "pet"}.json`;
  if (!name) { console.error("Usage: pet-pack.js <pet> [output.json]"); process.exit(1); }
  if (!isSafePetId(name)) { console.error("Pet name may contain lowercase letters, numbers, underscores, and hyphens only."); process.exit(1); }
  const file = path.join(pluginRoot(), "pets", `${name}.json`);
  const pet = readJson(file, null);
  const errors = validatePet(pet);
  if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
  const outPath = path.resolve(out);
  ensureDir(path.dirname(outPath));
  fs.copyFileSync(file, outPath);
  console.log(`Packed ${name} to ${outPath}`);
}

main();
