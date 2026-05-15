#!/usr/bin/env node

const path = require("path");
const { ensureDir, isSafePetId, pluginRoot, readJson, validatePet, writeJsonAtomic } = require("./pet-lib");

function argValue(flag, fallback) {
  const idx = process.argv.indexOf(flag);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
}

function positionalArgs() {
  const args = [];
  for (let i = 2; i < process.argv.length; i += 1) {
    const arg = process.argv[i];
    if (arg === "--dir") { i += 1; continue; }
    if (!arg.startsWith("--")) args.push(arg);
  }
  return args;
}

function main() {
  const installDir = path.resolve(argValue("--dir", pluginRoot()));
  const file = positionalArgs()[0];
  if (!file) { console.error("Usage: pet-import.js [--dir <install-dir>] <pet.json>"); process.exit(1); }
  const pet = readJson(path.resolve(file), null);
  const errors = validatePet(pet);
  if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
  const name = path.basename(file, ".json").toLowerCase();
  if (!isSafePetId(name)) { console.error("Pet file name may contain lowercase letters, numbers, underscores, and hyphens only."); process.exit(1); }
  const dest = path.join(installDir, "pets", `${name}.json`);
  ensureDir(path.dirname(dest));
  writeJsonAtomic(dest, pet);
  console.log(`Imported ${name} to ${dest}`);
}

main();
