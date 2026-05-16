#!/usr/bin/env node

const path = require("path");
const {
  availablePets,
  configPath,
  compactConfig,
  defaultConfig,
  ensureDir,
  formatPetValidationError,
  mergeConfig,
  normalizeConfig,
  readJson,
  validateConfiguredPets,
  writeJsonAtomic
} = require("./pet-lib");

function parseValue(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null") return null;
  if (/^-?\d+(\.d+)?$/.test(value)) return Number(value);
  if (/^[\[{]/.test(value)) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

function setPath(target, keyPath, value) {
  const parts = keyPath.split(".");
  if (parts.some((part) => ["__proto__", "prototype", "constructor"].includes(part))) {
    throw new Error("Unsafe config key");
  }
  let cursor = target;
  for (const part of parts.slice(0, -1)) {
    if (!cursor[part] || typeof cursor[part] !== "object" || Array.isArray(cursor[part])) {
      cursor[part] = {};
    }
    cursor = cursor[part];
  }
  cursor[parts[parts.length - 1]] = value;
}

function getPath(target, keyPath) {
  return keyPath.split(".").reduce((cursor, part) => {
    return cursor && Object.prototype.hasOwnProperty.call(cursor, part) ? cursor[part] : undefined;
  }, target);
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function usage() {
  console.log(`Usage:
  pet-config.js get [--full] [key]
  pet-config.js set <key> <value>

Examples:
  pet-config.js set language zh
  pet-config.js set displayMode full
  pet-config.js set show.petName false
  pet-config.js set quietHours '[{"start":"22:30","end":"08:00"}]'`);
}

function main() {
  const command = process.argv[2] || "get";
  const file = configPath();
  const config = normalizeConfig(mergeConfig(defaultConfig(), readJson(file, {})));

  if (command === "get") {
    const key = process.argv[3];
    const value = key && key !== "--full" ? getPath(config, key) : hasFlag("--full") ? config : compactConfig(config);
    console.log(JSON.stringify(value, null, 2));
    return;
  }

  if (command === "set") {
    const key = process.argv[3];
    const raw = process.argv[4];
    if (!key || raw === undefined) {
      usage();
      process.exit(1);
    }
    try {
      setPath(config, key, parseValue(raw));
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
    const normalized = normalizeConfig(config);
    const petValidation = validateConfiguredPets(normalized, availablePets());
    if (!petValidation.ok) {
      console.error(formatPetValidationError(petValidation));
      process.exit(1);
    }
    ensureDir(path.dirname(file));
    writeJsonAtomic(file, compactConfig(normalized));
    console.log(`Updated ${key} = ${JSON.stringify(getPath(normalized, key))}`);
    return;
  }

  usage();
  process.exit(1);
}

main();
