#!/usr/bin/env node

const { spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { ensureDir } = require("./pet-lib");

const ROOT = path.resolve(__dirname, "..");
const HOME = os.homedir();
const DEFAULT_INSTALL_DIR = path.join(HOME, ".claude", "status-pet");
const DEFAULT_SETTINGS = path.join(HOME, ".claude", "settings.json");
const DEFAULT_SKILLS_DIR = path.join(HOME, ".claude", "skills");
const DEFAULT_COMMANDS_DIR = path.join(HOME, ".claude", "commands");

function argValue(flag, fallback) {
  const idx = process.argv.indexOf(flag);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function copyDir(src, dest) {
  ensureDir(dest);
  fs.cpSync(src, dest, { recursive: true, force: true });
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function runInstall({ installDir, settingsPath, pet, dryRun, noHooks }) {
  const args = [
    path.join(ROOT, "scripts", "install.js"),
    "--dir",
    installDir,
    "--settings",
    settingsPath
  ];
  if (pet) args.push("--pet", pet);
  if (dryRun) args.push("--dry-run");
  if (noHooks) args.push("--no-hooks");

  const result = spawnSync(process.execPath, args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: "inherit"
  });
  if (result.status !== 0) process.exit(result.status || 1);
}

function main() {
  const pet = argValue("--pet", "");
  const installDir = path.resolve(argValue("--dir", DEFAULT_INSTALL_DIR));
  const settingsPath = path.resolve(argValue("--settings", DEFAULT_SETTINGS));
  const skillsDir = path.resolve(argValue("--skills-dir", DEFAULT_SKILLS_DIR));
  const commandsDir = path.resolve(argValue("--commands-dir", DEFAULT_COMMANDS_DIR));
  const dryRun = hasFlag("--dry-run");
  const noHooks = hasFlag("--no-hooks");
  const noSkill = hasFlag("--no-skill");
  const noCommand = hasFlag("--no-command");

  runInstall({ installDir, settingsPath, pet, dryRun, noHooks });

  const skillSrc = path.join(ROOT, "skills", "pet-control");
  const skillDest = path.join(skillsDir, "pet-control");
  const commandSrc = path.join(ROOT, "commands", "pet.md");
  const commandDest = path.join(commandsDir, "pet.md");

  if (dryRun) {
    if (!noSkill) console.log(`Would install skill to: ${skillDest}`);
    if (!noCommand) console.log(`Would install command to: ${commandDest}`);
    console.log("Would install all Claude status pet components.");
    return;
  }

  if (!noSkill) copyDir(skillSrc, skillDest);
  if (!noCommand) copyFile(commandSrc, commandDest);

  console.log("Installed Claude status pet components:");
  console.log(`- Runtime: ${installDir}`);
  console.log(`- Settings: ${settingsPath}`);
  if (!noSkill) console.log(`- Skill: ${skillDest}`);
  if (!noCommand) console.log(`- Command: ${commandDest}`);
  console.log("Restart Claude Code to load the status line, hooks, skill, and command.");
}

main();
