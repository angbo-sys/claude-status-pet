#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");
const { bundledPets, defaultConfig, ensureDir, mergeConfig, normalizeConfig, petExists, readJson, writeJsonAtomic } = require("./pet-lib");

const ROOT = path.resolve(__dirname, "..");
const HOME = os.homedir();
const DEFAULT_INSTALL_DIR = path.join(HOME, ".claude", "status-pet");
const DEFAULT_SETTINGS = path.join(HOME, ".claude", "settings.json");

function argValue(flag, fallback) {
  const idx = process.argv.indexOf(flag);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
}
function hasFlag(flag) { return process.argv.includes(flag); }

function copyDir(src, dest) { ensureDir(dest); fs.cpSync(src, dest, { recursive: true, force: true }); }
function chmodExecutable(file) { try { fs.chmodSync(file, 0o755); } catch {} }

function hookEntry(event, command) {
  const entry = { hooks: [{ type: "command", command, timeout: 3 }] };
  if (event === "PreToolUse" || event === "PostToolUse") entry.matcher = "*";
  return entry;
}

function mergeHooks(settings, command) {
  const events = ["SessionStart", "UserPromptSubmit", "PreToolUse", "PostToolUse", "Notification", "Stop", "SubagentStop", "PreCompact", "SessionEnd"];
  settings.hooks = settings.hooks || {};
  for (const event of events) {
    settings.hooks[event] = settings.hooks[event] || [];
    settings.hooks[event] = settings.hooks[event].filter((entry) => !JSON.stringify(entry).includes("status-pet/scripts/pet-hook.js"));
    const exists = settings.hooks[event].some((entry) => JSON.stringify(entry).includes(command));
    if (!exists) settings.hooks[event].push(hookEntry(event, command));
  }
}

function main() {
  const installDir = path.resolve(argValue("--dir", DEFAULT_INSTALL_DIR));
  const settingsPath = path.resolve(argValue("--settings", DEFAULT_SETTINGS));
  const pet = argValue("--pet", "byte");
  const dryRun = hasFlag("--dry-run");
  const noHooks = hasFlag("--no-hooks");
  const pets = bundledPets();

  if (!petExists(pet, pets)) {
    console.error(`Unknown pet: ${pet}`);
    console.error(`Available pets: ${pets.map((item) => item.name).join(", ") || "none"}`);
    process.exit(1);
  }

  const statuslineScript = path.join(installDir, "scripts", "pet-statusline.js");
  const hookScript = path.join(installDir, "scripts", "pet-hook.js");
  const existingConfig = readJson(path.join(installDir, "config.json"), {});
  const config = normalizeConfig(mergeConfig(defaultConfig(), { ...existingConfig, pet }));
  const settings = readJson(settingsPath, {});
  const previousStatusLine = settings.statusLine;
  settings.statusLine = { type: "command", command: statuslineScript, padding: 0 };
  if (Number(config.refreshInterval) > 0) settings.statusLine.refreshInterval = Number(config.refreshInterval);
  if (!noHooks) mergeHooks(settings, hookScript);

  if (dryRun) {
    console.log(`Would install to: ${installDir}`);
    console.log(`Would update settings: ${settingsPath}`);
    console.log(`Pet: ${pet}`);
    if (previousStatusLine?.command && previousStatusLine.command !== statuslineScript) console.log(`Would replace statusLine command: ${previousStatusLine.command}`);
    console.log(`Would ${noHooks ? "skip" : "merge"} hooks for status-pet`);
    return;
  }

  ensureDir(installDir);
  copyDir(path.join(ROOT, "scripts"), path.join(installDir, "scripts"));
  copyDir(path.join(ROOT, "pets"), path.join(installDir, "pets"));
  for (const file of fs.readdirSync(path.join(installDir, "scripts"))) {
    if (file.endsWith(".js")) chmodExecutable(path.join(installDir, "scripts", file));
  }
  writeJsonAtomic(path.join(installDir, "config.json"), config);
  ensureDir(path.dirname(settingsPath));
  if (fs.existsSync(settingsPath)) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    fs.copyFileSync(settingsPath, `${settingsPath}.status-pet-backup-${stamp}`);
  }
  writeJsonAtomic(settingsPath, settings);
  console.log(`Installed Claude status pet at ${installDir}`);
  console.log(`Updated ${settingsPath}`);
  console.log("Restart Claude Code to load the status line and hooks.");
}

main();
