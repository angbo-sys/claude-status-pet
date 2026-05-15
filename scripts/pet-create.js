#!/usr/bin/env node

const path = require("path");
const { ensureDir, writeJsonAtomic } = require("./pet-lib");

const DEFAULT_INSTALL_DIR = path.resolve(__dirname, "..");

function argValue(flag, fallback) {
  const idx = process.argv.indexOf(flag);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
}

function positionalArgs() {
  return process.argv.slice(2).filter((arg, index, args) => {
    if (arg.startsWith("--")) return false;
    return args[index - 1] !== "--dir";
  });
}

function title(name) { return name.charAt(0).toUpperCase() + name.slice(1); }

function main() {
  const installDir = path.resolve(argValue("--dir", DEFAULT_INSTALL_DIR));
  const name = positionalArgs()[0];
  if (!name || !/^[a-z0-9_-]+$/.test(name)) {
    console.error("Usage: pet-create.js [--dir <install-dir>] <name>");
    console.error("Pet name may contain lowercase letters, numbers, underscores, and hyphens.");
    process.exit(1);
  }
  const file = path.join(installDir, "pets", `${name}.json`);
  const pet = {
    name: title(name),
    description: "A custom Claude status pet.",
    personality: { success: ["done"], error: ["check"], default: ["with you"] },
    states: {
      idle: ["[o_o]", "[-_-]"], listening: ["[._.]", "[o_o]"], thinking: ["[o_o].", "[o_o]..", "[o_o]..."],
      tool: ["[>_>]", "[<_<]"], running: ["[$_$]", "[$-_]"], editing: ["[>_>]", "[>_o]"],
      searching: ["[o_?]", "[?_o]"], browsing: ["[o~o]", "[o-o]"], delegating: ["[>_>]", "[<_<]"],
      compacting: ["[o_o]", "[o_o]."], success: ["[^_^]", "[^o^]"], error: ["[x_x]", "[!_!]"],
      waiting: ["[?_?]", "[o_?]"], sleeping: ["[-_-] z", "[-_-] zz"]
    }
  };
  ensureDir(path.dirname(file));
  writeJsonAtomic(file, pet);
  console.log(`Created ${file}`);
}

main();
