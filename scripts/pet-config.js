#!/usr/bin/env node

const path = require("path");
const { configPath, defaultConfig, ensureDir, mergeConfig, normalizeConfig, readJson, writeJsonAtomic } = require("./pet-lib");

function parseValue(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null") return null;
  if (/^-?\d+(\.d+)?$/.test(value)) return Number(value);
  if (/^[\[{]/.test(value)) { try { return JSON.parse(value); } catch { return value; } }
  return value;
}

function setPath(target, keyPath, value) {
  const parts = keyPath.split(".");
  if (parts.some((part) => ["__proto__", "prototype", "constructor"].includes(part))) throw new Error("Unsafe config key");
  let cursor = target;
  for (const part of parts.slice(0, -1)) {
    if (!cursor[part] || typeof cursor[part] !== "object" || Array.isArray(cursor[part])) cursor[part] = {};
    cursor = cursor[part];
  }
  cursor[parts[parts.length - 1]] = value;
}

function getPath(target, keyPath) {
  return keyPath.split(".").reduce((cursor, part) => cursor && Object.prototype.hasOwnProperty.call(cursor, part) ? cursor[part] : undefined, target);
}

function main() {
  const command = process.argv[2] || "get";
  const file = configPath();
  const config = normalizeConfig(mergeConfig(defaultConfig(), readJson(file, {})));

  if (command === "get") {
    const key = process.argv[3];
    const value = key ? getPath(config, key) : config;
    console.log(JSON.stringify(value, null, 2));
    return;
  }

  if (command === "set") {
    const key = process.argv[3];
    const raw = process.argv[4];
    if (!key || raw === undefined) { console.log("Usage: pet-config.js set <key> <value>"); process.exit(1); }
    try { setPath(config, key, parseValue(raw)); } catch (error) { console.error(error.message); process.exit(1); }
    const normalized = normalizeConfig(config);
    ensureDir(path.dirname(file));
    writeJsonAtomic(file, normalized);
    console.log(`Updated ${key} = ${JSON.stringify(getPath(normalized, key))}`);
    return;
  }

  console.log("Usage: pet-config.js get [key]\npet-config.js set <key> <value>");
  process.exit(1);
}

main();
