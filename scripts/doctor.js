#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");
const { compactConfig, listPetsInDir, normalizeConfig, readJson, readJsonDetailed } = require("./pet-lib");

const HOME = os.homedir();
const DEFAULT_INSTALL_DIR = path.join(HOME, ".claude", "status-pet");
const DEFAULT_SETTINGS = path.join(HOME, ".claude", "settings.json");
const DEFAULT_SKILL_DIR = path.join(HOME, ".claude", "skills", "pet-control");
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

function exists(file) {
  return fs.existsSync(file);
}

function fileSize(file) {
  try {
    return fs.statSync(file).size;
  } catch {
    return 0;
  }
}

function status(ok) {
  return ok ? "ok" : "missing";
}

function isHookCommand(entry, hookPath) {
  const body = JSON.stringify(entry);
  return body.includes("status-pet/scripts/pet-hook.js") || body.includes(hookPath);
}

function countHookEntries(settings, hookPath) {
  let count = 0;
  for (const event of EVENTS) {
    const entries = settings.hooks?.[event];
    if (!Array.isArray(entries)) continue;
    count += entries.filter((entry) => isHookCommand(entry, hookPath)).length;
  }
  return count;
}

function summarize(checks) {
  const failures = checks.filter((check) => !check.ok);
  if (!failures.length) return { status: "ok", problem: "", fix: "" };
  const critical = failures.find((check) => check.critical) || failures[0];
  let fix = "Run: node ./scripts/install-all.js --pet byte";
  if (critical.name === "configured pet exists") fix = "Run: node ~/.claude/status-pet/scripts/pet.js list, then switch to an available pet.";
  if (critical.name === "hook entries") fix = "Run install-all again, then restart Claude Code.";
  if (critical.name.endsWith("JSON")) fix = `Repair or restore the malformed ${critical.name.replace(" JSON", "")} file, then run doctor again.`;
  return {
    status: failures.length === checks.length ? "missing" : "partial",
    problem: critical.name,
    fix
  };
}

function main() {
  const installDir = path.resolve(argValue("--dir", DEFAULT_INSTALL_DIR));
  const settingsPath = path.resolve(argValue("--settings", DEFAULT_SETTINGS));
  const skillDir = path.resolve(argValue("--skill-dir", DEFAULT_SKILL_DIR));
  const configPath = path.join(installDir, "config.json");
  const statuslinePath = path.join(installDir, "scripts", "pet-statusline.js");
  const hookPath = path.join(installDir, "scripts", "pet-hook.js");
  const statePath = path.join(installDir, "state.json");
  const settingsCheck = readJsonDetailed(settingsPath);
  const configCheck = readJsonDetailed(configPath);
  const stateCheck = readJsonDetailed(statePath);
  const settings = settingsCheck.ok ? settingsCheck.value : {};
  const config = configCheck.ok ? configCheck.value : {};
  const normalizedConfig = normalizeConfig(config);
  const pets = listPetsInDir(path.join(installDir, "pets"));
  const petNames = pets.map((pet) => pet.name);
  const configuredPet = process.env.CLAUDE_STATUS_PET || config.pet || "";
  const statusLineCommand = settings.statusLine?.command || "";
  const statusLineRegistered =
    statusLineCommand.includes("status-pet/scripts/pet-statusline.js") || statusLineCommand === statuslinePath;
  const hookCount = countHookEntries(settings, hookPath);
  const stateBytes = fileSize(statePath);
  const skillPath = path.join(skillDir, "SKILL.md");
  const skillText = exists(skillPath) ? fs.readFileSync(skillPath, "utf8") : "";
  const skillSynced = [
    "pet.js health",
    "pet.js quick",
    "pet.js growth",
    "pet.js config set displayMode panel"
  ].every((text) => skillText.includes(text));
  const configNormalized = configCheck.ok && JSON.stringify(config) === JSON.stringify(compactConfig(normalizedConfig));
  const checks = [
    { name: "install dir", ok: exists(installDir), critical: true },
    { name: "settings", ok: exists(settingsPath), critical: true },
    { name: "settings JSON", ok: !settingsCheck.exists || settingsCheck.ok, critical: true },
    { name: "config", ok: exists(configPath) },
    { name: "config JSON", ok: !configCheck.exists || configCheck.ok, critical: true },
    { name: "status line script", ok: exists(statuslinePath), critical: true },
    { name: "hook script", ok: exists(hookPath), critical: true },
    { name: "statusLine registered", ok: statusLineRegistered, critical: true },
    { name: "hook entries", ok: hookCount > 0, critical: true },
    { name: "configured pet exists", ok: Boolean(configuredPet && petNames.includes(configuredPet)), critical: true },
    { name: "config normalized", ok: configNormalized },
    { name: "state JSON", ok: !stateCheck.exists || stateCheck.ok },
    { name: "state file size", ok: stateBytes < 512 * 1024 },
    { name: "skill synced", ok: skillSynced }
  ];
  const summary = summarize(checks);

  console.log("Claude Status Pet Doctor");
  console.log(`Summary: ${summary.status}`);
  if (summary.problem) console.log(`Problem: ${summary.problem}`);
  if (summary.fix) console.log(`Fix: ${summary.fix}`);
  console.log(`Install dir: ${installDir} (${status(exists(installDir))})`);
  console.log(`Settings: ${settingsPath} (${status(exists(settingsPath))})`);
  console.log(`Config: ${configPath} (${status(exists(configPath))})`);
  console.log(`Status line script: ${statuslinePath} (${status(exists(statuslinePath))})`);
  console.log(`Hook script: ${hookPath} (${status(exists(hookPath))})`);
  console.log(`State file: ${statePath} (${status(exists(statePath))})`);
  console.log(`State size: ${stateBytes} bytes (${stateBytes < 512 * 1024 ? "ok" : "large"})`);
  if (settingsCheck.exists && !settingsCheck.ok) console.log(`Settings JSON: invalid (${settingsCheck.error})`);
  if (configCheck.exists && !configCheck.ok) console.log(`Config JSON: invalid (${configCheck.error})`);
  if (stateCheck.exists && !stateCheck.ok) console.log(`State JSON: invalid (${stateCheck.error})`);
  console.log(`statusLine registered: ${statusLineRegistered ? "yes" : "no"}`);
  console.log(`Hook entries: ${hookCount}`);
  console.log(`Config normalized: ${configNormalized ? "yes" : "no"}`);
  console.log(`Skill synced: ${skillSynced ? "yes" : "no"} (${skillPath})`);
  console.log(`Available pets: ${petNames.join(", ") || "none"}`);
  console.log(`Configured pet: ${configuredPet || "none"}`);
  console.log(`Configured pet exists: ${configuredPet && petNames.includes(configuredPet) ? "yes" : "no"}`);
  if (process.env.CLAUDE_STATUS_PET) {
    console.log("Environment override: CLAUDE_STATUS_PET is set");
  }
}

main();
