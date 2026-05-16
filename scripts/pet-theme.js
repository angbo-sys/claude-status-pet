#!/usr/bin/env node

const path = require("path");
const { compactConfig, configPath, defaultConfig, ensureDir, mergeConfig, normalizeConfig, readJson, writeJsonAtomic } = require("./pet-lib");

const THEMES = {
  focus: {
    displayMode: "panel",
    palette: "classic",
    panelRows: 2,
    panelCompact: true,
    flairChance: 0,
    careHintChance: 0.01,
    randomEventChance: 0.01,
    show: { mood: true, stats: true, flair: false, petVitals: true, gitChanges: false }
  },
  cute: {
    pet: "spark",
    displayMode: "panel",
    palette: "soft",
    panelRows: 3,
    panelCompact: false,
    flairChance: 0.1,
    careHintChance: 0.06,
    randomEventChance: 0.08,
    show: { mood: true, stats: true, flair: true, petVitals: true }
  },
  dense: {
    displayMode: "full",
    palette: "classic",
    style: "powerline",
    cwdSegments: 2,
    contextBarWidth: 6,
    flairChance: 0,
    randomEventChance: 0,
    show: { mood: false, stats: true, flair: false, context: true, tasks: true, git: true, gitChanges: true }
  },
  night: {
    displayMode: "panel",
    palette: "terminal",
    panelRows: 2,
    panelCompact: true,
    flairChance: 0.02,
    careHintChance: 0,
    randomEventChance: 0.02,
    quietHours: [{ start: "22:30", end: "08:00" }],
    show: { mood: true, stats: true, flair: true, petVitals: true, gitChanges: false }
  },
  minimal: {
    pet: "mono",
    displayMode: "quiet",
    palette: "mono",
    flairChance: 0,
    careHintChance: 0,
    randomEventChance: 0,
    show: { mood: false, stats: false, flair: false, petVitals: false, git: false, context: false, tasks: false }
  }
};

function usage() {
  console.log(`Usage: pet-theme.js [--list] <theme>

Themes:
${Object.keys(THEMES).map((name) => `  ${name}`).join("\n")}`);
}

function main() {
  if (process.argv.includes("--list")) {
    usage();
    return;
  }

  const name = process.argv[2];
  if (!name || !THEMES[name]) {
    usage();
    process.exit(name ? 1 : 0);
  }

  const file = configPath();
  const config = normalizeConfig(mergeConfig(mergeConfig(defaultConfig(), readJson(file, {})), THEMES[name]));
  ensureDir(path.dirname(file));
  writeJsonAtomic(file, compactConfig(config));
  console.log(`Applied theme: ${name}`);
}

main();
