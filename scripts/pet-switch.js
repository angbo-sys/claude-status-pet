#!/usr/bin/env node

const path = require("path");
const { defaultConfig, ensureDir, listPetsInDir, normalizeConfig, readJson, writeJsonAtomic } = require("./pet-lib");

const DEFAULT_INSTALL_DIR = path.resolve(__dirname, "..");

function argValue(flag, fallback) {
  const idx = process.argv.indexOf(flag);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
}

function hasFlag(flag) { return process.argv.includes(flag); }

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
  const configFile = path.join(installDir, "config.json");
  const pets = listPetsInDir(path.join(installDir, "pets"));

  if (hasFlag("--list")) {
    for (const pet of pets) console.log(pet.description ? `${pet.name}\t${pet.description}` : pet.name);
    return;
  }

  const pet = positionalArgs()[0];
  if (!pet) { console.log("Usage: pet-switch.js [--dir <install-dir>] [--list] <pet>"); process.exit(1); }
  const available = pets.map((item) => item.name);
  if (!available.includes(pet)) {
    console.error(`Unknown pet: ${pet}`);
    console.error(`Available pets: ${available.join(", ") || "none"}`);
    process.exit(1);
  }

  const config = normalizeConfig({ ...defaultConfig(), ...readJson(configFile, {}), pet });
  ensureDir(path.dirname(configFile));
  writeJsonAtomic(configFile, config);
  console.log(`Switched Claude status pet to: ${pet}`);
  console.log("Restart Claude Code if the status line does not update immediately.");
}

main();
