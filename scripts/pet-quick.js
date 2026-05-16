#!/usr/bin/env node

const path = require("path");
const {
  availablePets,
  compactConfig,
  configPath,
  defaultConfig,
  ensureDir,
  formatPetValidationError,
  isSafePetId,
  mergeConfig,
  normalizeConfig,
  readJson,
  validateConfiguredPets,
  writeJsonAtomic
} = require("./pet-lib");

const SHOW_ALIASES = {
  label: "label",
  mood: "mood",
  model: "model",
  cwd: "cwd",
  path: "cwd",
  git: "git",
  changes: "gitChanges",
  gitChanges: "gitChanges",
  context: "context",
  ctx: "context",
  tasks: "tasks",
  version: "version",
  name: "petName",
  petName: "petName",
  vitals: "petVitals",
  petVitals: "petVitals",
  care: "petVitals",
  cost: "cost",
  elapsed: "elapsed",
  time: "elapsed",
  tool: "tool",
  stats: "stats",
  flair: "flair"
};

const RECIPES = {
  cute: {
    pet: "spark",
    language: "zh",
    displayMode: "panel",
    palette: "soft",
    panelRows: 3,
    panelCompact: false,
    flairChance: 0.1,
    careHintChance: 0.06,
    randomEventChance: 0.08,
    show: { mood: true, stats: true, flair: true, petVitals: true }
  },
  focus: {
    displayMode: "panel",
    panelRows: 2,
    panelCompact: true,
    flairChance: 0,
    careHintChance: 0.01,
    randomEventChance: 0.01,
    show: { mood: true, stats: true, flair: false, petVitals: true, gitChanges: false }
  },
  full: {
    displayMode: "full",
    style: "powerline",
    cwdSegments: 2,
    show: { context: true, tasks: true, git: true, gitChanges: true, stats: true }
  },
  clean: {
    displayMode: "compact",
    flairChance: 0,
    randomEventChance: 0,
    show: { mood: false, stats: false, flair: false, petVitals: false, cost: false, elapsed: false }
  },
  quiet: {
    pet: "mono",
    displayMode: "quiet",
    palette: "mono",
    flairChance: 0,
    careHintChance: 0,
    randomEventChance: 0,
    show: { mood: false, stats: false, flair: false, petVitals: false, git: false, context: false, tasks: false }
  }
};

function argValue(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return "";
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function csv(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function applyShowList(config, value, enabled) {
  for (const item of csv(value)) {
    const key = SHOW_ALIASES[item];
    if (!key) {
      console.error(`Unknown display field: ${item}`);
      console.error(`Known fields: ${Object.keys(SHOW_ALIASES).join(", ")}`);
      process.exit(1);
    }
    config.show = config.show || {};
    config.show[key] = enabled;
  }
}

function usage() {
  console.log(`Usage:
  pet-quick.js [recipe] [options]

Recipes:
  ${Object.keys(RECIPES).join(", ")}

Options:
  --pet <byte|mono|orbit|pico|spark>
  --theme <cute|focus|full|clean|quiet>
  --lang <en|zh>
  --mode <quiet|compact|balanced|full|panel>
  --palette <mono|classic|soft|terminal|alert>
  --rows <2|3>
  --compact
  --show <field,field>
  --hide <field,field>
  --name <pet-name>

Examples:
  pet.js quick cute
  pet.js quick --pet pico --lang zh --mode panel --rows 2 --show git,context,tasks --hide cost,elapsed
  pet.js quick focus --pet byte`);
}

function main() {
  if (hasFlag("--help") || hasFlag("-h") || hasFlag("--list")) {
    usage();
    return;
  }

  const recipe = process.argv.slice(2).find((arg) => !arg.startsWith("--") && RECIPES[arg]);
  const theme = argValue("--theme");
  const file = configPath();
  let config = normalizeConfig(mergeConfig(defaultConfig(), readJson(file, {})));

  if (recipe) config = normalizeConfig(mergeConfig(config, RECIPES[recipe]));
  if (theme) {
    if (!RECIPES[theme]) {
      console.error(`Unknown quick theme: ${theme}`);
      usage();
      process.exit(1);
    }
    config = normalizeConfig(mergeConfig(config, RECIPES[theme]));
  }

  const pet = argValue("--pet");
  if (pet) {
    if (!isSafePetId(pet)) {
      console.error("Pet name may contain lowercase letters, numbers, underscores, and hyphens only.");
      process.exit(1);
    }
    config.pet = pet;
  }
  if (argValue("--lang")) config.language = argValue("--lang");
  if (argValue("--mode")) config.displayMode = argValue("--mode");
  if (argValue("--palette")) config.palette = argValue("--palette");
  if (argValue("--rows")) config.panelRows = Number(argValue("--rows"));
  if (hasFlag("--compact")) config.panelCompact = true;
  if (argValue("--name")) {
    config.petName = argValue("--name");
    config.show = { ...(config.show || {}), petName: true };
  }
  if (argValue("--show")) applyShowList(config, argValue("--show"), true);
  if (argValue("--hide")) applyShowList(config, argValue("--hide"), false);

  const normalized = normalizeConfig(config);
  const petValidation = validateConfiguredPets(normalized, availablePets());
  if (!petValidation.ok) {
    console.error(formatPetValidationError(petValidation));
    process.exit(1);
  }
  ensureDir(path.dirname(file));
  writeJsonAtomic(file, compactConfig(normalized));

  console.log("Updated pet quick setup:");
  console.log(JSON.stringify(compactConfig(normalized), null, 2));
  console.log("Restart Claude Code if the status line does not update immediately.");
}

main();
