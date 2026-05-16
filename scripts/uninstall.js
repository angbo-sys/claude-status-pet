#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");
const { ensureDir, readJson, writeJsonAtomic } = require("./pet-lib");

const HOME = os.homedir();
const DEFAULT_INSTALL_DIR = path.join(HOME, ".claude", "status-pet");
const DEFAULT_SETTINGS = path.join(HOME, ".claude", "settings.json");
const DEFAULT_SKILL_DIR = path.join(HOME, ".claude", "skills", "pet-control");
const DEFAULT_COMMAND_FILE = path.join(HOME, ".claude", "commands", "pet.md");
const EVENTS = [
  "SessionStart",
  "UserPromptSubmit",
  "PreToolUse",
  "PostToolUse",
  "Notification",
  "Stop",
  "SubagentStop",
  "PreCompact",
  "SessionEnd"
];

function argValue(flag, fallback) {
  const idx = process.argv.indexOf(flag);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function backup(file) {
  if (!fs.existsSync(file)) return "";
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFile = `${file}.status-pet-backup-${stamp}`;
  fs.copyFileSync(file, backupFile);
  return backupFile;
}

function removeHooks(settings) {
  if (!settings.hooks) return 0;
  let removed = 0;
  for (const event of EVENTS) {
    if (!Array.isArray(settings.hooks[event])) continue;
    const before = settings.hooks[event].length;
    settings.hooks[event] = settings.hooks[event].filter((entry) => {
      return !JSON.stringify(entry).includes("status-pet/scripts/pet-hook.js");
    });
    removed += before - settings.hooks[event].length;
    if (settings.hooks[event].length === 0) delete settings.hooks[event];
  }
  if (Object.keys(settings.hooks).length === 0) delete settings.hooks;
  return removed;
}

function main() {
  const installDir = path.resolve(argValue("--dir", DEFAULT_INSTALL_DIR));
  const settingsPath = path.resolve(argValue("--settings", DEFAULT_SETTINGS));
  const dryRun = hasFlag("--dry-run");
  const keepFiles = hasFlag("--keep-files");
  const all = hasFlag("--all");
  const skillDir = path.resolve(argValue("--skill-dir", DEFAULT_SKILL_DIR));
  const commandFile = path.resolve(argValue("--command-file", DEFAULT_COMMAND_FILE));
  const settings = readJson(settingsPath, {});
  const hadStatusLine = JSON.stringify(settings.statusLine || {}).includes("status-pet/scripts/pet-statusline.js");
  const hookCount = removeHooks(settings);

  if (hadStatusLine) delete settings.statusLine;

  if (dryRun) {
    console.log(`Would update settings: ${settingsPath}`);
    console.log(`Would remove statusLine: ${hadStatusLine ? "yes" : "no"}`);
    console.log(`Would remove hook entries: ${hookCount}`);
    console.log(`Would remove install dir: ${keepFiles ? "no" : installDir}`);
    if (all) {
      console.log(`Would remove skill dir: ${skillDir}`);
      console.log(`Would remove command file: ${commandFile}`);
    }
    return;
  }

  ensureDir(path.dirname(settingsPath));
  const backupFile = backup(settingsPath);
  writeJsonAtomic(settingsPath, settings);
  if (!keepFiles) fs.rmSync(installDir, { recursive: true, force: true });
  if (all) {
    fs.rmSync(skillDir, { recursive: true, force: true });
    fs.rmSync(commandFile, { force: true });
  }

  if (backupFile) console.log(`Backed up settings to ${backupFile}`);
  console.log(`Updated ${settingsPath}`);
  if (!keepFiles) console.log(`Removed ${installDir}`);
  if (all) {
    console.log(`Removed ${skillDir}`);
    console.log(`Removed ${commandFile}`);
  }
  console.log("Restart Claude Code to fully unload the status pet.");
}

main();
