#!/usr/bin/env node

const { spawnSync } = require("child_process");
const path = require("path");

function main() {
  const preset = process.argv[2] || "cute-zh";
  const result = spawnSync(process.execPath, [path.join(__dirname, "pet-preset.js"), preset], {
    stdio: "inherit"
  });
  process.exit(result.status || 0);
}

main();
