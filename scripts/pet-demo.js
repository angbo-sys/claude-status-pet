#!/usr/bin/env node

const { loadConfig, loadPet, translate } = require("./pet-lib");

const STATES = [
  ["editing", "Write"],
  ["searching", "Grep"],
  ["testing", "Bash"],
  ["success", ""],
  ["error", "Bash"]
];

function main() {
  const config = loadConfig();
  const pet = loadPet(config.pet);
  const frames = pet.states || {};
  for (const [state, tool] of STATES) {
    const frame = (frames[state] || frames.tool || frames.idle || ["[o_o]"])[0];
    const label = translate(config.language, "labels", state === "success" ? "done" : state === "error" ? "tool failed" : state);
    console.log([frame, label, tool, "Sonnet", ".../demo"].filter(Boolean).join(" · "));
  }
}

main();
