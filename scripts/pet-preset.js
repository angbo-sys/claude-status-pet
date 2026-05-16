#!/usr/bin/env node

const { compactConfig, configPath, defaultConfig, ensureDir, mergeConfig, normalizeConfig, readJson, writeJsonAtomic } = require("./pet-lib");
const path = require("path");

const PRESETS = {
  minimal: {
    pet: "mono",
    displayMode: "quiet",
    palette: "mono",
    flairChance: 0,
    show: { petVitals: false, flair: false, mood: false, stats: false }
  },
  "cute-zh": {
    pet: "spark",
    language: "zh",
    displayMode: "balanced",
    palette: "soft",
    flairChance: 0.08,
    show: { petName: false, petVitals: true, mood: true, flair: true }
  },
  "powerline-full": {
    displayMode: "full",
    style: "powerline",
    palette: "soft",
    cwdSegments: 2,
    show: { context: true, tasks: true, git: true, gitChanges: true, stats: true }
  },
  "panel-zh": {
    pet: "spark",
    language: "zh",
    displayMode: "panel",
    palette: "soft",
    cwdSegments: 2,
    careHintChance: 0.05,
    show: { context: true, tasks: true, git: true, gitChanges: true, stats: true, petVitals: true }
  },
  "quiet-work": {
    displayMode: "compact",
    palette: "classic",
    flairChance: 0,
    show: { mood: false, stats: false, flair: false, petVitals: false }
  }
};

function usage() {
  console.log(`Usage: pet-preset.js [--list] <preset>

Presets:
${Object.keys(PRESETS).map((name) => `  ${name}`).join("\n")}`);
}

function main() {
  if (process.argv.includes("--list")) {
    usage();
    return;
  }

  const name = process.argv[2];
  if (!name || !PRESETS[name]) {
    usage();
    process.exit(name ? 1 : 0);
  }

  const file = configPath();
  const config = normalizeConfig(mergeConfig(mergeConfig(defaultConfig(), readJson(file, {})), PRESETS[name]));
  ensureDir(path.dirname(file));
  writeJsonAtomic(file, compactConfig(config));
  console.log(`Applied preset: ${name}`);
}

main();
