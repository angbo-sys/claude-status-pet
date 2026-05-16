#!/usr/bin/env node

const path = require("path");
const { color, isSafePetId, listPetsInDir, readJson } = require("./pet-lib");

const DEFAULT_INSTALL_DIR = path.resolve(__dirname, "..");
const STATES = [
  "idle",
  "listening",
  "thinking",
  "tool",
  "running",
  "testing",
  "installing",
  "git",
  "reviewing",
  "editing",
  "searching",
  "browsing",
  "delegating",
  "compacting",
  "success",
  "error",
  "waiting",
  "sleeping"
];
const ACTION_STATES = {
  blink: "idle",
  listen: "listening",
  think: "thinking",
  work: "tool",
  run: "running",
  code: "editing",
  search: "searching",
  browse: "browsing",
  cheer: "success",
  celebrate: "success",
  shake: "error",
  wait: "waiting",
  sleep: "sleeping",
  nap: "sleeping"
};

function argValue(flag, fallback) {
  const idx = process.argv.indexOf(flag);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function positionalArgs() {
  const args = [];
  for (let i = 2; i < process.argv.length; i += 1) {
    const arg = process.argv[i];
    if (arg === "--dir" || arg === "--state" || arg === "--action" || arg === "--cycles") {
      i += 1;
      continue;
    }
    if (!arg.startsWith("--")) args.push(arg);
  }
  return args;
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function previewPet(installDir, name, useColor) {
  if (!isSafePetId(name)) {
    console.error(`Invalid pet name: ${name}`);
    process.exitCode = 1;
    return;
  }
  const file = path.join(installDir, "pets", `${name}.json`);
  const pet = readJson(file, null);
  if (!pet || !pet.states) {
    console.error(`Unknown pet: ${name}`);
    process.exitCode = 1;
    return;
  }

  console.log(`${name}${pet.description ? ` - ${pet.description}` : ""}`);
  for (const state of STATES) {
    const frames = pet.states[state];
    if (!frames) continue;
    const rendered = frames.map((frame) => color(frame, pet.color || "36", useColor)).join("  ");
    console.log(`${state.padEnd(11)} ${rendered}`);
  }
}

function animatePet(installDir, name, useColor, state, cycles) {
  if (!isSafePetId(name)) {
    console.error(`Invalid pet name: ${name}`);
    process.exit(1);
  }
  const file = path.join(installDir, "pets", `${name}.json`);
  const pet = readJson(file, null);
  const frames = pet?.states?.[state];
  if (!frames) {
    console.error(`Unknown pet or state: ${name}/${state}`);
    process.exit(1);
  }

  for (let cycle = 0; cycle < cycles; cycle += 1) {
    for (const frame of frames) {
      const rendered = color(frame, pet.color || "36", useColor);
      process.stdout.write(`\r${name} ${state} ${rendered}   `);
      sleep(180);
    }
  }
  process.stdout.write("\n");
}

function main() {
  const installDir = path.resolve(argValue("--dir", DEFAULT_INSTALL_DIR));
  const useColor = !hasFlag("--no-color") && !process.env.NO_COLOR;
  const animate = hasFlag("--animate");
  const action = argValue("--action", "");
  const state = argValue("--state", ACTION_STATES[action] || "thinking");
  const cycles = Math.max(1, Number(argValue("--cycles", "4")) || 4);
  const requested = positionalArgs();
  const pets = listPetsInDir(path.join(installDir, "pets"));
  const names = requested.length ? requested : pets.map((pet) => pet.name);

  if (names.length === 0) {
    console.error(`No pets found in ${path.join(installDir, "pets")}`);
    process.exit(1);
  }

  names.forEach((name, index) => {
    if (index) console.log("");
    if (animate) animatePet(installDir, name, useColor, state, cycles);
    else previewPet(installDir, name, useColor);
  });
}

main();
