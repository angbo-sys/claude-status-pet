#!/usr/bin/env node

const path = require("path");
const { isSafePetId, listPetsInDir, readJson, validatePet } = require("./pet-lib");

const DEFAULT_INSTALL_DIR = path.resolve(__dirname, "..");

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
  const installDir = path.resolve(argValue("--dir", DEFAULT_INSTALL_DIR));
  const petsDir = path.join(installDir, "pets");
  const requested = positionalArgs();
  const names = requested.length ? requested : listPetsInDir(petsDir).map((pet) => pet.name);
  let failed = false;
  for (const name of names) {
    if (!isSafePetId(name)) { failed = true; console.log(`${name}: invalid`); console.log("  - Pet name may contain lowercase letters, numbers, underscores, and hyphens only"); continue; }
    const file = path.join(petsDir, `${name}.json`);
    const errors = validatePet(readJson(file, null));
    if (errors.length) { failed = true; console.log(`${name}: invalid`); for (const error of errors) console.log(`  - ${error}`); }
    else console.log(`${name}: ok`);
  }
  if (failed) process.exit(1);
}

main();
