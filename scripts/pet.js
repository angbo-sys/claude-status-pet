#!/usr/bin/env node

const { spawnSync } = require("child_process");
const path = require("path");

const COMMANDS = {
  "install-all": "install-all.js",
  install: "install.js",
  switch: "pet-switch.js",
  list: "pet-switch.js",
  preview: "pet-preview.js",
  care: "pet-play.js",
  feed: "pet-play.js",
  play: "pet-play.js",
  nap: "pet-play.js",
  pet: "pet-play.js",
  config: "pet-config.js",
  quick: "pet-quick.js",
  preset: "pet-preset.js",
  theme: "pet-theme.js",
  report: "pet-report.js",
  achievements: "pet-achievements.js",
  health: "pet-health.js",
  growth: "pet-growth.js",
  demo: "pet-demo.js",
  pack: "pet-pack.js",
  import: "pet-import.js",
  setup: "pet-setup.js",
  validate: "pet-validate.js",
  create: "pet-create.js",
  doctor: "doctor.js",
  uninstall: "uninstall.js",
  test: "test.js"
};

function usage() {
  console.log(`Usage: pet.js <command> [args]

Commands:
  install      Install status pet into Claude Code settings
  install-all  Install runtime, hooks, skill, and command
  list         List installed pets
  switch       Switch the active pet
  preview      Preview pet frames
  care         Show pet energy and bond
  feed         Give the pet a snack
  play         Play with the pet
  nap          Let the pet rest
  pet          Give the pet a tiny pat
  config       Read or update pet configuration
  quick        Configure pet, theme, language, layout, and visible fields quickly
  preset       Apply a built-in configuration preset
  theme        Apply a visual theme package
  report       Show today or week companion report
  achievements Show unlocked pet achievements
  health       Show install, config, care, diary, and recent events
  growth       Show persistent pet level, XP, unlocks, and growth log
  demo         Print simulated status lines
  pack         Export a pet JSON file
  import       Import a pet JSON file
  setup        Apply a starter setup preset
  validate     Validate pet JSON files
  create       Create a new pet JSON template
  doctor       Diagnose installation and configuration
  uninstall    Remove settings and installed files
  test         Run local tests`);
}

function main() {
  const command = process.argv[2];
  if (!command || command === "help" || command === "--help" || command === "-h") {
    usage();
    return;
  }

  const script = COMMANDS[command];
  if (!script) {
    console.error(`Unknown command: ${command}`);
    usage();
    process.exit(1);
  }

  const args = process.argv.slice(3);
  if (command === "list") args.unshift("--list");
  if (["care", "feed", "play", "nap", "pet"].includes(command)) {
    args.unshift(command === "care" ? "status" : command);
  }

  const result = spawnSync(process.execPath, [path.join(__dirname, script), ...args], {
    stdio: "inherit"
  });
  process.exit(result.status ?? 1);
}

main();
