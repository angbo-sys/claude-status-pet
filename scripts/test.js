#!/usr/bin/env node

const assert = require("assert");
const { execFileSync, spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  bundledPets,
  displayWidth,
  readJson,
  pruneState,
  statusFromHook,
  truncate
} = require("./pet-lib");

const ROOT = path.resolve(__dirname, "..");

function runNode(script, input, env = {}) {
  const result = spawnSync(process.execPath, [path.join(ROOT, script)], {
    cwd: ROOT,
    input: JSON.stringify(input),
    encoding: "utf8",
    env: { ...process.env, ...env }
  });
  assert.strictEqual(result.status, 0, result.stderr);
  return result.stdout;
}

function testSyntax() {
  for (const script of [
    "scripts/pet-lib.js",
    "scripts/pet-hook.js",
    "scripts/pet-statusline.js",
    "scripts/install-all.js",
    "scripts/install.js",
    "scripts/pet-switch.js",
    "scripts/pet-preview.js",
    "scripts/pet-play.js",
    "scripts/pet-config.js",
    "scripts/pet-quick.js",
    "scripts/pet-preset.js",
    "scripts/pet-theme.js",
    "scripts/pet-report.js",
    "scripts/pet-achievements.js",
    "scripts/pet-health.js",
    "scripts/pet-growth.js",
    "scripts/pet-demo.js",
    "scripts/pet-pack.js",
    "scripts/pet-import.js",
    "scripts/pet-setup.js",
    "scripts/pet-validate.js",
    "scripts/pet-create.js",
    "scripts/doctor.js",
    "scripts/uninstall.js",
    "scripts/pet.js",
    "scripts/test.js"
  ]) {
    execFileSync(process.execPath, ["--check", script], { cwd: ROOT, stdio: "pipe" });
  }
}

function testPets() {
  const pets = bundledPets().map((pet) => pet.name);
  assert.deepStrictEqual(pets, ["byte", "mono", "orbit", "pico", "spark"]);
}

function testStatusMapping() {
  assert.strictEqual(statusFromHook({ hook_event_name: "PreToolUse", tool_name: "Bash" }).state, "running");
  assert.strictEqual(statusFromHook({ hook_event_name: "PreToolUse", tool_name: "Bash", tool_input: { command: "npm test" } }).state, "testing");
  assert.strictEqual(statusFromHook({ hook_event_name: "PreToolUse", tool_name: "Bash", tool_input: { command: "git status" } }).state, "reviewing");
  assert.strictEqual(statusFromHook({ hook_event_name: "PreToolUse", tool_name: "Write" }).state, "editing");
  assert.strictEqual(statusFromHook({ hook_event_name: "PreToolUse", tool_name: "Grep" }).state, "searching");
  assert.strictEqual(statusFromHook({ hook_event_name: "PreCompact" }).state, "compacting");
}

function testHookAndStatusline() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "claude-status-pet-test-"));
  const env = { CLAUDE_STATUS_PET_DIR: dir, CLAUDE_STATUS_PET: "byte", NO_COLOR: "1" };

  runNode("scripts/pet-hook.js", {
    hook_event_name: "PreToolUse",
    session_id: "demo",
    tool_name: "Write",
    cwd: "/tmp/demo"
  }, env);

  const state = readJson(path.join(dir, "state.json"), {});
  assert.strictEqual(state.sessions.demo.state, "editing");
  assert.strictEqual(state.sessions.demo.stats.tools, 1);
  assert.strictEqual(state.sessions.demo.stats.edits, 1);
  assert.ok(state.sessions.demo.care.energy <= 80);
  assert.ok(state.daily);

  const output = runNode("scripts/pet-statusline.js", {
    session_id: "demo",
    model: { display_name: "Sonnet" },
    workspace: { current_dir: "/tmp/demo" },
    cost: { total_cost_usd: 0.0123, total_duration_ms: 42000 }
  }, env);

  assert.match(output, /editing/);
  assert.match(output, /Write/);
  assert.match(output, /Sonnet/);
  assert.match(output, /E/);
}

function testPetCare() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "claude-status-pet-care-"));
  const env = { CLAUDE_STATUS_PET_DIR: dir };
  const feed = spawnSync(process.execPath, ["scripts/pet-play.js", "feed"], {
    cwd: ROOT,
    encoding: "utf8",
    env: { ...process.env, ...env }
  });
  assert.strictEqual(feed.status, 0, feed.stderr);
  assert.match(feed.stdout, /Snack accepted/);

  const play = spawnSync(process.execPath, ["scripts/pet.js", "play"], {
    cwd: ROOT,
    encoding: "utf8",
    env: { ...process.env, ...env }
  });
  assert.strictEqual(play.status, 0, play.stderr);
  assert.match(play.stdout, /Play break/);

  const state = readJson(path.join(dir, "state.json"), {});
  assert.ok(state.sessions.default.care.affection > 50);

  const care = spawnSync(process.execPath, ["scripts/pet-play.js", "status"], {
    cwd: ROOT,
    encoding: "utf8",
    env: { ...process.env, ...env }
  });
  assert.strictEqual(care.status, 0, care.stderr);
  assert.match(care.stdout, /Pet Status/);
  assert.match(care.stdout, /Energy/);

  fs.writeFileSync(path.join(dir, "config.json"), JSON.stringify({ language: "zh" }));
  const zh = spawnSync(process.execPath, ["scripts/pet-play.js", "feed"], {
    cwd: ROOT,
    encoding: "utf8",
    env: { ...process.env, ...env }
  });
  assert.strictEqual(zh.status, 0, zh.stderr);
  assert.match(zh.stdout, /投喂成功/);
}

function testCarePersistsAcrossSessions() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "claude-status-pet-persist-"));
  const env = { CLAUDE_STATUS_PET_DIR: dir, NO_COLOR: "1" };
  runNode("scripts/pet-hook.js", {
    hook_event_name: "PreToolUse",
    session_id: "one",
    tool_name: "Write",
    cwd: "/tmp/demo"
  }, env);
  const feed = spawnSync(process.execPath, ["scripts/pet-play.js", "feed"], {
    cwd: ROOT,
    encoding: "utf8",
    env: { ...process.env, ...env }
  });
  assert.strictEqual(feed.status, 0, feed.stderr);
  const fedState = readJson(path.join(dir, "state.json"), {});
  const fedCare = fedState.pet.care;
  const fedGrowth = fedState.pet.growth;
  assert.ok(fedCare.snacks >= 1);
  assert.ok(fedGrowth.xp >= 6);

  runNode("scripts/pet-hook.js", {
    hook_event_name: "UserPromptSubmit",
    session_id: "two",
    cwd: "/tmp/demo"
  }, env);
  const nextState = readJson(path.join(dir, "state.json"), {});
  assert.strictEqual(nextState.sessions.two.care.snacks, fedCare.snacks);
  assert.strictEqual(nextState.pet.care.snacks, fedCare.snacks);
  assert.strictEqual(nextState.sessions.two.growth.xp, nextState.pet.growth.xp);

  const output = runNode("scripts/pet-statusline.js", {
    session_id: "brand-new",
    columns: 120,
    model: { display_name: "Sonnet" },
    workspace: { current_dir: "/tmp/demo" }
  }, env);
  assert.match(output, /E/);
}

function testRichStatusline() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "claude-status-pet-rich-"));
  fs.writeFileSync(path.join(dir, "config.json"), JSON.stringify({
    pet: "spark",
    displayMode: "full",
    style: "powerline",
    palette: "soft",
    cwdSegments: 2,
    flairChance: 0,
    show: {
      version: true,
      context: true,
      tasks: true,
      gitChanges: false
    }
  }));
  const env = { CLAUDE_STATUS_PET_DIR: dir, CLAUDE_STATUS_PET: "spark", NO_COLOR: "1" };
  const output = runNode("scripts/pet-statusline.js", {
    session_id: "rich",
    columns: 160,
    version: "2.1.140",
    model: { display_name: "Sonnet" },
    workspace: { current_dir: "/tmp/demo/project" },
    context_window: { used_percentage: 37 },
    tasks: [{ id: "a", status: "running" }, { id: "b", status: "done" }],
    cost: { total_cost_usd: 0.02, total_duration_ms: 90000 }
  }, env);

  assert.match(output, /\[/);
  assert.match(output, /\[███░░░░░\] 37% ctx/);
  assert.match(output, /1\/2 tasks/);
  assert.match(output, /2\.1\.140/);
  assert.match(output, /\.\.\.\/demo\/project/);
}

function testChineseStatusline() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "claude-status-pet-zh-"));
  fs.writeFileSync(path.join(dir, "config.json"), JSON.stringify({
    pet: "spark",
    language: "zh",
    displayMode: "full",
    flairChance: 1,
    show: {
      context: true,
      tasks: true,
      gitChanges: false
    }
  }));
  const env = { CLAUDE_STATUS_PET_DIR: dir, CLAUDE_STATUS_PET: "spark", NO_COLOR: "1" };
  runNode("scripts/pet-hook.js", {
    hook_event_name: "PreToolUse",
    session_id: "zh",
    tool_name: "Write",
    cwd: "/tmp/demo"
  }, env);
  const output = runNode("scripts/pet-statusline.js", {
    session_id: "zh",
    columns: 160,
    model: { display_name: "Sonnet" },
    workspace: { current_dir: "/tmp/demo" },
    context_window: { used_percentage: 25 },
    tasks: [{ status: "running" }]
  }, env);

  assert.match(output, /写东西/);
  assert.match(output, /专注/);
  assert.match(output, /上下文/);
  assert.match(output, /任务/);
  assert.match(output, /能/);
  assert.match(output, /亲/);
}

function testPanelStatusline() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "claude-status-pet-panel-"));
  fs.writeFileSync(path.join(dir, "config.json"), JSON.stringify({
    pet: "spark",
    language: "zh",
    displayMode: "panel",
    panelRows: 2,
    panelCompact: false,
    flairChance: 0,
    randomEventChance: 1,
    show: {
      context: true,
      tasks: true,
      gitChanges: false
    }
  }));
  const env = { CLAUDE_STATUS_PET_DIR: dir, CLAUDE_STATUS_PET: "spark", NO_COLOR: "1" };
  runNode("scripts/pet-hook.js", {
    hook_event_name: "PreToolUse",
    session_id: "panel",
    tool_name: "Bash",
    tool_input: { command: "npm test" },
    cwd: "/tmp/demo/project"
  }, env);
  const output = runNode("scripts/pet-statusline.js", {
    session_id: "panel",
    columns: 120,
    model: { display_name: "Sonnet" },
    workspace: { current_dir: "/tmp/demo/project" },
    context_window: { used_percentage: 50 },
    tasks: [{ status: "running" }, { status: "done" }]
  }, env);
  const lines = output.trimEnd().split("\n");
  assert.strictEqual(lines.length, 2);
  assert.match(lines[0], /跑测试/);
  assert.match(lines[0], /小|线索|火花|茶|思路|diff/);
  assert.match(lines[1], /Sonnet/);
  assert.match(lines[1], /上下文/);
  assert.match(lines[1], /测试/);

  const state = readJson(path.join(dir, "state.json"), {});
  assert.ok(state.sessions.panel.events.length >= 1);
  assert.ok(state.daily[Object.keys(state.daily)[0]].events.length >= 1);
}

function testSwitch() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "claude-status-pet-switch-"));
  fs.cpSync(path.join(ROOT, "pets"), path.join(dir, "pets"), { recursive: true });
  const result = spawnSync(process.execPath, ["scripts/pet-switch.js", "--dir", dir, "orbit"], {
    cwd: ROOT,
    encoding: "utf8"
  });
  assert.strictEqual(result.status, 0, result.stderr);
  assert.strictEqual(readJson(path.join(dir, "config.json"), {}).pet, "orbit");
}

function testPreviewAndDoctor() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "claude-status-pet-tools-"));
  const settingsPath = path.join(dir, "settings.json");
  fs.cpSync(path.join(ROOT, "pets"), path.join(dir, "pets"), { recursive: true });
  fs.mkdirSync(path.join(dir, "scripts"));
  fs.writeFileSync(path.join(dir, "scripts", "pet-statusline.js"), "");
  fs.writeFileSync(path.join(dir, "scripts", "pet-hook.js"), "");
  fs.writeFileSync(path.join(dir, "config.json"), JSON.stringify({ pet: "byte" }));
  fs.writeFileSync(settingsPath, JSON.stringify({
    statusLine: { command: path.join(dir, "scripts", "pet-statusline.js") },
    hooks: {
      SessionStart: [{ hooks: [{ command: path.join(dir, "scripts", "pet-hook.js") }] }]
    }
  }));

  const preview = spawnSync(process.execPath, ["scripts/pet-preview.js", "--dir", dir, "--no-color", "byte"], {
    cwd: ROOT,
    encoding: "utf8"
  });
  assert.strictEqual(preview.status, 0, preview.stderr);
  assert.match(preview.stdout, /idle/);
  assert.match(preview.stdout, /editing/);

  const animated = spawnSync(process.execPath, ["scripts/pet-preview.js", "--dir", dir, "--no-color", "--animate", "--state", "idle", "--cycles", "1", "byte"], {
    cwd: ROOT,
    encoding: "utf8"
  });
  assert.strictEqual(animated.status, 0, animated.stderr);
  assert.match(animated.stdout, /byte idle/);

  const doctor = spawnSync(process.execPath, ["scripts/doctor.js", "--dir", dir, "--settings", settingsPath], {
    cwd: ROOT,
    encoding: "utf8"
  });
  assert.strictEqual(doctor.status, 0, doctor.stderr);
  assert.match(doctor.stdout, /Summary: ok|Summary: partial/);
  assert.match(doctor.stdout, /Configured pet: byte/);
  assert.match(doctor.stdout, /statusLine registered: yes/);
}

function testUnifiedCli() {
  const list = spawnSync(process.execPath, ["scripts/pet.js", "list"], {
    cwd: ROOT,
    encoding: "utf8"
  });
  assert.strictEqual(list.status, 0, list.stderr);
  assert.match(list.stdout, /byte/);
  assert.match(list.stdout, /orbit/);
}

function testCreateAndValidate() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "claude-status-pet-create-"));
  const create = spawnSync(process.execPath, ["scripts/pet-create.js", "--dir", dir, "demo"], {
    cwd: ROOT,
    encoding: "utf8"
  });
  assert.strictEqual(create.status, 0, create.stderr);
  const duplicate = spawnSync(process.execPath, ["scripts/pet-create.js", "--dir", dir, "demo"], {
    cwd: ROOT,
    encoding: "utf8"
  });
  assert.notStrictEqual(duplicate.status, 0);

  const validate = spawnSync(process.execPath, ["scripts/pet-validate.js", "--dir", dir, "demo"], {
    cwd: ROOT,
    encoding: "utf8"
  });
  assert.strictEqual(validate.status, 0, validate.stderr);
  assert.match(validate.stdout, /demo: ok/);

  const all = spawnSync(process.execPath, ["scripts/pet-validate.js"], {
    cwd: ROOT,
    encoding: "utf8"
  });
  assert.strictEqual(all.status, 0, all.stderr);
  assert.match(all.stdout, /spark: ok/);
}

function testConfigCommand() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "claude-status-pet-config-"));
  const env = { ...process.env, CLAUDE_STATUS_PET_DIR: dir };
  const set = spawnSync(process.execPath, ["scripts/pet-config.js", "set", "language", "zh"], {
    cwd: ROOT,
    encoding: "utf8",
    env
  });
  assert.strictEqual(set.status, 0, set.stderr);

  const setNested = spawnSync(process.execPath, ["scripts/pet-config.js", "set", "show.petName", "true"], {
    cwd: ROOT,
    encoding: "utf8",
    env
  });
  assert.strictEqual(setNested.status, 0, setNested.stderr);

  const get = spawnSync(process.execPath, ["scripts/pet-config.js", "get", "show.petName"], {
    cwd: ROOT,
    encoding: "utf8",
    env
  });
  assert.strictEqual(get.status, 0, get.stderr);
  assert.match(get.stdout, /true/);

  const config = readJson(path.join(dir, "config.json"), {});
  assert.strictEqual(config.language, "zh");
  assert.strictEqual(config.show.petName, true);

  const invalid = spawnSync(process.execPath, ["scripts/pet-config.js", "set", "__proto__.polluted", "true"], {
    cwd: ROOT,
    encoding: "utf8",
    env
  });
  assert.notStrictEqual(invalid.status, 0);
  assert.strictEqual({}.polluted, undefined);

  const quietHours = spawnSync(process.execPath, ["scripts/pet-config.js", "set", "quietHours", '[{"start":"22:30","end":"08:00"}]'], {
    cwd: ROOT,
    encoding: "utf8",
    env
  });
  assert.strictEqual(quietHours.status, 0, quietHours.stderr);
  assert.deepStrictEqual(readJson(path.join(dir, "config.json"), {}).quietHours, [{ start: "22:30", end: "08:00" }]);

  const quick = spawnSync(process.execPath, [
    "scripts/pet-quick.js",
    "cute",
    "--pet",
    "pico",
    "--rows",
    "2",
    "--hide",
    "cost,elapsed",
    "--show",
    "git,context,tasks"
  ], {
    cwd: ROOT,
    encoding: "utf8",
    env
  });
  assert.strictEqual(quick.status, 0, quick.stderr);
  const quickConfig = readJson(path.join(dir, "config.json"), {});
  assert.strictEqual(quickConfig.pet, "pico");
  assert.strictEqual(quickConfig.language, "zh");
  assert.strictEqual(quickConfig.displayMode, "panel");
  assert.strictEqual(quickConfig.panelRows, 2);
  assert.strictEqual(quickConfig.show.cost, false);
  assert.strictEqual(quickConfig.show.elapsed, false);

  const invalidPet = spawnSync(process.execPath, ["scripts/pet-config.js", "set", "pet", "no_such_pet"], {
    cwd: ROOT,
    encoding: "utf8",
    env
  });
  assert.notStrictEqual(invalidPet.status, 0);
  assert.match(invalidPet.stderr, /Unknown pet/);

  const invalidQuickPet = spawnSync(process.execPath, ["scripts/pet-quick.js", "--pet", "no_such_pet"], {
    cwd: ROOT,
    encoding: "utf8",
    env
  });
  assert.notStrictEqual(invalidQuickPet.status, 0);
  assert.match(invalidQuickPet.stderr, /Unknown pet/);
}

function testPresetAndUninstallAll() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "claude-status-pet-preset-"));
  const env = { ...process.env, CLAUDE_STATUS_PET_DIR: dir };
  const preset = spawnSync(process.execPath, ["scripts/pet-preset.js", "cute-zh"], {
    cwd: ROOT,
    encoding: "utf8",
    env
  });
  assert.strictEqual(preset.status, 0, preset.stderr);
  const config = readJson(path.join(dir, "config.json"), {});
  assert.strictEqual(config.language, "zh");
  assert.strictEqual(config.pet, "spark");

  const theme = spawnSync(process.execPath, ["scripts/pet-theme.js", "focus"], {
    cwd: ROOT,
    encoding: "utf8",
    env
  });
  assert.strictEqual(theme.status, 0, theme.stderr);
  const themed = readJson(path.join(dir, "config.json"), {});
  assert.strictEqual(themed.displayMode, "panel");
  assert.strictEqual(themed.panelRows, 2);

  const dry = spawnSync(process.execPath, [
    "scripts/uninstall.js",
    "--dry-run",
    "--all",
    "--dir",
    path.join(dir, "runtime"),
    "--settings",
    path.join(dir, "settings.json"),
    "--skill-dir",
    path.join(dir, "skills", "pet-control"),
    "--command-file",
    path.join(dir, "commands", "pet.md")
  ], {
    cwd: ROOT,
    encoding: "utf8"
  });
  assert.strictEqual(dry.status, 0, dry.stderr);
  assert.match(dry.stdout, /Would remove skill dir/);
  assert.match(dry.stdout, /Would remove command file/);
}

function testReportAchievementsDemoAndPack() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "claude-status-pet-extra-"));
  const env = { ...process.env, CLAUDE_STATUS_PET_DIR: dir, NO_COLOR: "1" };
  runNode("scripts/pet-hook.js", {
    hook_event_name: "PreToolUse",
    session_id: "extra",
    tool_name: "Bash",
    tool_input: { command: "npm test" },
    cwd: "/tmp/demo"
  }, env);
  spawnSync(process.execPath, ["scripts/pet-play.js", "feed"], { cwd: ROOT, env, encoding: "utf8" });

  const report = spawnSync(process.execPath, ["scripts/pet-report.js"], { cwd: ROOT, env, encoding: "utf8" });
  assert.strictEqual(report.status, 0, report.stderr);
  assert.match(report.stdout, /Today Companion Report/);
  assert.match(report.stdout, /Top tool/);

  const health = spawnSync(process.execPath, ["scripts/pet-health.js"], { cwd: ROOT, env, encoding: "utf8" });
  assert.strictEqual(health.status, 0, health.stderr);
  assert.match(health.stdout, /Pet Health/);
  assert.match(health.stdout, /Growth/);

  const growth = spawnSync(process.execPath, ["scripts/pet-growth.js"], { cwd: ROOT, env, encoding: "utf8" });
  assert.strictEqual(growth.status, 0, growth.stderr);
  assert.match(growth.stdout, /Pet Growth/);

  const achievements = spawnSync(process.execPath, ["scripts/pet-achievements.js"], { cwd: ROOT, env, encoding: "utf8" });
  assert.strictEqual(achievements.status, 0, achievements.stderr);
  assert.match(achievements.stdout, /Pet Achievements/);

  const demo = spawnSync(process.execPath, ["scripts/pet-demo.js"], { cwd: ROOT, env, encoding: "utf8" });
  assert.strictEqual(demo.status, 0, demo.stderr);
  assert.match(demo.stdout, /Sonnet/);

  const packed = path.join(dir, "spark.json");
  const pack = spawnSync(process.execPath, ["scripts/pet-pack.js", "spark", packed], { cwd: ROOT, encoding: "utf8" });
  assert.strictEqual(pack.status, 0, pack.stderr);
  assert.ok(fs.existsSync(packed));

  const unsafePack = spawnSync(process.execPath, ["scripts/pet-pack.js", "../spark", path.join(dir, "bad.json")], { cwd: ROOT, encoding: "utf8" });
  assert.notStrictEqual(unsafePack.status, 0);

  const importDir = fs.mkdtempSync(path.join(os.tmpdir(), "claude-status-pet-import-"));
  const importFile = path.join(importDir, "shared_pet.json");
  fs.copyFileSync(packed, importFile);
  const imported = spawnSync(process.execPath, ["scripts/pet-import.js", "--dir", importDir, importFile], { cwd: ROOT, encoding: "utf8" });
  assert.strictEqual(imported.status, 0, imported.stderr);
  assert.ok(fs.existsSync(path.join(importDir, "pets", "shared_pet.json")));
  const duplicateImport = spawnSync(process.execPath, ["scripts/pet-import.js", "--dir", importDir, importFile], { cwd: ROOT, encoding: "utf8" });
  assert.notStrictEqual(duplicateImport.status, 0);
}

function testStatePruning() {
  const old = Date.now() - 9 * 24 * 60 * 60 * 1000;
  const fresh = Date.now();
  const state = {
    sessions: {
      old: { updated_at: old },
      fresh: { updated_at: fresh }
    },
    daily: Object.fromEntries(Array.from({ length: 35 }, (_, index) => {
      const day = String(index + 1).padStart(2, "0");
      return [`2026-01-${day}`, { tools: index }];
    }))
  };
  const pruned = pruneState(state, fresh);
  assert.deepStrictEqual(Object.keys(pruned.sessions), ["fresh"]);
  assert.strictEqual(Object.keys(pruned.daily).length, 30);
  assert.ok(pruned.daily["2026-01-35"]);
}

function testInstallAllDryRun() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "claude-status-pet-all-"));
  const result = spawnSync(process.execPath, [
    "scripts/install-all.js",
    "--dry-run",
    "--pet",
    "byte",
    "--dir",
    path.join(dir, "status-pet"),
    "--settings",
    path.join(dir, "settings.json"),
    "--skills-dir",
    path.join(dir, "skills"),
    "--commands-dir",
    path.join(dir, "commands")
  ], {
    cwd: ROOT,
    encoding: "utf8"
  });
  assert.strictEqual(result.status, 0, result.stderr);
  assert.match(result.stdout, /Would install skill/);
  assert.match(result.stdout, /Would install command/);
}

function testInstallCleansRemovedBuiltIns() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "claude-status-pet-install-"));
  const installDir = path.join(dir, "status-pet");
  const petsDir = path.join(installDir, "pets");
  fs.mkdirSync(petsDir, { recursive: true });
  fs.writeFileSync(path.join(petsDir, "whale.json"), JSON.stringify({ states: { idle: ["whale"] } }));
  fs.writeFileSync(path.join(petsDir, "mimo.json"), JSON.stringify({ states: { idle: ["mimo"] } }));
  fs.writeFileSync(path.join(petsDir, "custom.json"), JSON.stringify({ states: { idle: ["custom"] } }));
  fs.writeFileSync(path.join(petsDir, ".builtin-pets.json"), JSON.stringify(["byte", "legacy"]));
  fs.writeFileSync(path.join(petsDir, "legacy.json"), JSON.stringify({ states: { idle: ["legacy"] } }));

  const result = spawnSync(process.execPath, [
    "scripts/install.js",
    "--pet",
    "byte",
    "--dir",
    installDir,
    "--settings",
    path.join(dir, "settings.json")
  ], {
    cwd: ROOT,
    encoding: "utf8"
  });
  assert.strictEqual(result.status, 0, result.stderr);
  assert.ok(!fs.existsSync(path.join(petsDir, "whale.json")));
  assert.ok(!fs.existsSync(path.join(petsDir, "mimo.json")));
  assert.ok(!fs.existsSync(path.join(petsDir, "legacy.json")));
  assert.ok(fs.existsSync(path.join(petsDir, "custom.json")));
  assert.ok(fs.existsSync(path.join(petsDir, "byte.json")));

  const keepDir = path.join(dir, "keep-pet");
  fs.mkdirSync(keepDir, { recursive: true });
  fs.writeFileSync(path.join(keepDir, "config.json"), JSON.stringify({ pet: "orbit" }));
  const keep = spawnSync(process.execPath, [
    "scripts/install.js",
    "--dir",
    keepDir,
    "--settings",
    path.join(dir, "keep-settings.json")
  ], {
    cwd: ROOT,
    encoding: "utf8"
  });
  assert.strictEqual(keep.status, 0, keep.stderr);
  assert.strictEqual(readJson(path.join(keepDir, "config.json"), {}).pet, "orbit");
}

function testWidth() {
  assert.strictEqual(displayWidth("abc"), 3);
  assert.strictEqual(displayWidth("你好"), 4);
  assert.strictEqual(displayWidth("\x1b[36m你好\x1b[0m"), 4);
  assert.ok(displayWidth(truncate("你好abc", 4)) <= 4);
  assert.match(truncate("\x1b[36mabcdef", 4), /\x1b\[0m…$/);
}

function testHealthAndDoctorDiagnostics() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "claude-status-pet-health-"));
  const env = { ...process.env, CLAUDE_STATUS_PET_DIR: dir, NO_COLOR: "1" };
  fs.writeFileSync(path.join(dir, "config.json"), JSON.stringify({
    pet: "byte",
    language: "en",
    displayMode: "balanced",
    palette: "classic"
  }));
  const health = spawnSync(process.execPath, ["scripts/pet-health.js"], {
    cwd: ROOT,
    encoding: "utf8",
    env
  });
  assert.strictEqual(health.status, 0, health.stderr);
  assert.match(health.stdout, /Config: ok/);

  const broken = fs.mkdtempSync(path.join(os.tmpdir(), "claude-status-pet-broken-"));
  const settingsPath = path.join(broken, "settings.json");
  fs.mkdirSync(path.join(broken, "status-pet"), { recursive: true });
  fs.writeFileSync(path.join(broken, "status-pet", "config.json"), "{broken");
  fs.writeFileSync(settingsPath, JSON.stringify({}));
  const doctor = spawnSync(process.execPath, [
    "scripts/doctor.js",
    "--dir",
    path.join(broken, "status-pet"),
    "--settings",
    settingsPath,
    "--skill-dir",
    path.join(broken, "skills", "pet-control")
  ], {
    cwd: ROOT,
    encoding: "utf8"
  });
  assert.strictEqual(doctor.status, 0, doctor.stderr);
  assert.match(doctor.stdout, /Config JSON: invalid/);
}

testSyntax();
testPets();
testStatusMapping();
testHookAndStatusline();
testPetCare();
testCarePersistsAcrossSessions();
testRichStatusline();
testChineseStatusline();
testPanelStatusline();
testSwitch();
testPreviewAndDoctor();
testUnifiedCli();
testCreateAndValidate();
testConfigCommand();
testInstallAllDryRun();
testInstallCleansRemovedBuiltIns();
testPresetAndUninstallAll();
testReportAchievementsDemoAndPack();
testStatePruning();
testWidth();
testHealthAndDoctorDiagnostics();

console.log("All tests passed");
