#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");

const DEFAULT_DATA_DIR = path.join(os.homedir(), ".claude", "status-pet");
const STATE_FILE = "state.json";
const CONFIG_FILE = "config.json";

function dataDir() {
  return process.env.CLAUDE_STATUS_PET_DIR || process.env.CLAUDE_PLUGIN_DATA || DEFAULT_DATA_DIR;
}

function pluginRoot() {
  return path.resolve(__dirname, "..");
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readStdinJson() {
  const raw = fs.readFileSync(0, "utf8").trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function readJsonDetailed(file) {
  try {
    return {
      exists: fs.existsSync(file),
      ok: true,
      value: JSON.parse(fs.readFileSync(file, "utf8")),
      error: ""
    };
  } catch (error) {
    return {
      exists: fs.existsSync(file),
      ok: false,
      value: null,
      error: error && error.code === "ENOENT" ? "missing" : error.message
    };
  }
}

function writeJsonAtomic(file, value) {
  ensureDir(path.dirname(file));
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(tmp, file);
}

function statePath() {
  return path.join(dataDir(), STATE_FILE);
}

function configPath() {
  return path.join(dataDir(), CONFIG_FILE);
}

function defaultConfig() {
  return {
    pet: "byte",
    language: "en",
    displayMode: "balanced",
    palette: "classic",
    style: "plain",
    separator: " · ",
    cwdSegments: 1,
    contextBarWidth: 8,
    flairChance: 0.04,
    careHintChance: 0.02,
    randomEventChance: 0.04,
    refreshInterval: 0,
    customText: "",
    companionPet: "",
    quietHours: [],
    panelRows: 3,
    panelCompact: false,
    petName: "",
    show: {
      label: true,
      mood: true,
      model: true,
      cwd: true,
      git: true,
      gitChanges: true,
      context: true,
      tasks: true,
      version: false,
      petVitals: true,
      petName: false,
      cost: true,
      elapsed: true,
      tool: true,
      stats: true,
      flair: true
    },
    colors: true,
    maxWidth: 120
  };
}

function isSafePetId(name) {
  return /^[a-z0-9_-]{1,48}$/.test(String(name || ""));
}

function coerceBoolean(value, fallback) {
  return typeof value === "boolean" ? value : fallback;
}

function coerceNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function coerceString(value, fallback, maxLength) {
  if (typeof value !== "string") return fallback;
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

function normalizeQuietHours(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((range) => ({
      start: typeof range?.start === "string" ? range.start : "",
      end: typeof range?.end === "string" ? range.end : ""
    }))
    .filter((range) => /^\d{1,2}:\d{2}$/.test(range.start) && /^\d{1,2}:\d{2}$/.test(range.end))
    .slice(0, 4);
}

function normalizeConfig(config) {
  const base = defaultConfig();
  const merged = mergeConfig(base, config && typeof config === "object" ? config : {});
  const show = {};
  for (const [key, fallback] of Object.entries(base.show)) {
    show[key] = coerceBoolean(merged.show?.[key], fallback);
  }
  return {
    ...merged,
    pet: isSafePetId(merged.pet) ? merged.pet : base.pet,
    language: ["en", "zh"].includes(merged.language) ? merged.language : base.language,
    displayMode: ["quiet", "compact", "balanced", "full", "panel"].includes(merged.displayMode) ? merged.displayMode : base.displayMode,
    palette: ["mono", "classic", "soft", "terminal", "alert"].includes(merged.palette) ? merged.palette : base.palette,
    style: ["plain", "powerline"].includes(merged.style) ? merged.style : base.style,
    separator: coerceString(merged.separator, base.separator, 12),
    cwdSegments: Math.round(coerceNumber(merged.cwdSegments, base.cwdSegments, 1, 5)),
    contextBarWidth: Math.round(coerceNumber(merged.contextBarWidth, base.contextBarWidth, 4, 24)),
    flairChance: coerceNumber(merged.flairChance, base.flairChance, 0, 1),
    careHintChance: coerceNumber(merged.careHintChance, base.careHintChance, 0, 1),
    randomEventChance: coerceNumber(merged.randomEventChance, base.randomEventChance, 0, 1),
    refreshInterval: Math.round(coerceNumber(merged.refreshInterval, base.refreshInterval, 0, 3600)),
    customText: coerceString(merged.customText, base.customText, 48),
    companionPet: merged.companionPet && isSafePetId(merged.companionPet) ? merged.companionPet : "",
    quietHours: normalizeQuietHours(merged.quietHours),
    panelRows: Math.round(coerceNumber(merged.panelRows, base.panelRows, 2, 3)),
    panelCompact: coerceBoolean(merged.panelCompact, base.panelCompact),
    petName: coerceString(merged.petName, base.petName, 32),
    show,
    colors: coerceBoolean(merged.colors, base.colors),
    maxWidth: Math.round(coerceNumber(merged.maxWidth, base.maxWidth, 40, 240))
  };
}

function compactConfig(config) {
  const normalized = normalizeConfig(config);
  const defaults = defaultConfig();
  const output = {
    pet: normalized.pet,
    language: normalized.language,
    displayMode: normalized.displayMode,
    palette: normalized.palette
  };

  for (const key of [
    "style",
    "separator",
    "cwdSegments",
    "contextBarWidth",
    "flairChance",
    "careHintChance",
    "randomEventChance",
    "refreshInterval",
    "customText",
    "companionPet",
    "quietHours",
    "panelRows",
    "panelCompact",
    "petName",
    "colors",
    "maxWidth"
  ]) {
    if (JSON.stringify(normalized[key]) !== JSON.stringify(defaults[key])) output[key] = normalized[key];
  }

  const show = {};
  for (const [key, value] of Object.entries(normalized.show || {})) {
    if (value !== defaults.show[key]) show[key] = value;
  }
  if (Object.keys(show).length) output.show = show;
  return output;
}

function mergeConfig(base, override) {
  return {
    ...base,
    ...override,
    show: {
      ...(base.show || {}),
      ...(override.show || {})
    }
  };
}

function loadConfig() {
  return normalizeConfig(readJson(configPath(), {}));
}

const I18N = {
  en: {
    labels: {
      idle: "idle",
      waking: "waking",
      listening: "listening",
      waiting: "waiting",
      done: "done",
      "agent done": "agent done",
      "running shell": "running shell",
      testing: "testing",
      installing: "installing",
      reviewing: "reviewing",
      git: "git",
      editing: "editing",
      searching: "searching",
      browsing: "browsing",
      delegating: "delegating",
      "using tool": "using tool",
      "tool failed": "tool failed",
      "tool done": "tool done",
      compacting: "compacting",
      thinking: "thinking",
      sleeping: "sleeping",
      napping: "napping"
    },
    moods: {
      tired: "tired",
      happy: "happy",
      lonely: "lonely",
      careful: "careful",
      confident: "confident",
      busy: "busy",
      sleepy: "sleepy",
      focused: "focused",
      fresh: "fresh",
      curious: "curious",
      wired: "wired",
      proud: "proud",
      frazzled: "frazzled",
      rested: "rested",
      hungry: "hungry"
    },
    units: {
      moves: "moves",
      edits: "edits",
      fails: "fails",
      streak: "streak",
      tasks: "tasks",
      shells: "shells",
      tests: "tests",
      installs: "installs",
      git: "git",
      ctx: "ctx",
      energy: "E",
      bond: "B",
      clean: "clean"
    },
    care: {
      feed: "Snack accepted.",
      play: "Play break logged.",
      nap: "Nap time.",
      pet: "Tiny pat registered.",
      status: "Status",
      energy: "Energy",
      bond: "bond",
      snacks: "snacks",
      plays: "play",
      naps: "naps",
      dataDir: "Data dir"
    }
  },
  zh: {
    labels: {
      idle: "发呆",
      waking: "醒来",
      listening: "听着",
      waiting: "等你",
      done: "完成",
      "agent done": "分身完成",
      "running shell": "跑命令",
      testing: "跑测试",
      installing: "装依赖",
      reviewing: "看改动",
      git: "整理 Git",
      editing: "写东西",
      searching: "找线索",
      browsing: "看网页",
      delegating: "派分身",
      "using tool": "用工具",
      "tool failed": "出错了",
      "tool done": "工具完成",
      compacting: "收拾记忆",
      thinking: "思考中",
      sleeping: "睡觉",
      napping: "小睡"
    },
    moods: {
      tired: "累了",
      happy: "开心",
      lonely: "想陪陪",
      careful: "小心",
      confident: "自信",
      busy: "忙碌",
      sleepy: "困了",
      focused: "专注",
      fresh: "精神",
      curious: "好奇",
      wired: "高速",
      proud: "得意",
      frazzled: "有点乱",
      rested: "休息好啦",
      hungry: "想补能量"
    },
    units: {
      moves: "步",
      edits: "次编辑",
      fails: "次失败",
      streak: "连胜",
      tasks: "任务",
      shells: "命令",
      tests: "测试",
      installs: "安装",
      git: "Git",
      ctx: "上下文",
      energy: "能",
      bond: "亲",
      clean: "干净"
    },
    care: {
      feed: "投喂成功。",
      play: "玩耍了一会儿。",
      nap: "进入小睡。",
      pet: "摸摸完成。",
      status: "状态",
      energy: "能量",
      bond: "亲密度",
      snacks: "零食",
      plays: "玩耍",
      naps: "小睡",
      dataDir: "数据目录"
    }
  }
};

function locale(language) {
  return I18N[language] || I18N.en;
}

function translate(language, section, key) {
  return locale(language)[section]?.[key] || I18N.en[section]?.[key] || key;
}

function listPetsInDir(dir) {
  try {
    return fs
      .readdirSync(dir)
      .filter((file) => file.endsWith(".json"))
      .map((file) => {
        const name = path.basename(file, ".json");
        const pet = readJson(path.join(dir, file), null);
        return pet && pet.states ? { name, description: pet.description || "" } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

function bundledPets() {
  return listPetsInDir(path.join(pluginRoot(), "pets"));
}

function installedPets() {
  return listPetsInDir(path.join(dataDir(), "pets"));
}

function availablePets() {
  const pets = new Map();
  for (const pet of [...installedPets(), ...bundledPets()]) pets.set(pet.name, pet);
  return [...pets.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function petExists(name, pets = bundledPets()) {
  return pets.some((pet) => pet.name === name);
}

function validateConfiguredPets(config, pets = availablePets()) {
  const available = pets.map((pet) => pet.name);
  if (!available.includes(config.pet)) {
    return { ok: false, field: "pet", name: config.pet, available };
  }
  if (config.companionPet && !available.includes(config.companionPet)) {
    return { ok: false, field: "companionPet", name: config.companionPet, available };
  }
  return { ok: true, available };
}

function formatPetValidationError(result) {
  return [
    `Unknown ${result.field}: ${result.name}`,
    `Available pets: ${result.available.join(", ") || "none"}`
  ].join("\n");
}

function petSearchPaths(name) {
  if (!isSafePetId(name)) return [];
  return [
    path.join(dataDir(), "pets", `${name}.json`),
    path.join(pluginRoot(), "pets", `${name}.json`)
  ];
}

function loadPet(name) {
  for (const file of petSearchPaths(name)) {
    const pet = readJson(file, null);
    if (pet && pet.states) return pet;
  }
  return {
    name: "Byte",
    states: {
      idle: ["[o_o]", "[-_-]"],
      listening: ["[._.]", "[o_o]"],
      thinking: ["[o_o].", "[o_o]..", "[o_o]..."],
      tool: [">_>", "[<_<]"],
      success: ["[^_^]"],
      error: ["[x_x]"],
      waiting: ["[?_?]"],
      sleeping: ["[-_-] z"]
    }
  };
}

function nowMs() {
  return Date.now();
}

function sessionKey(input) {
  return input.session_id || input.sessionId || "default";
}

function statusFromHook(input) {
  const event = input.hook_event_name || "Unknown";
  const tool = input.tool_name || "";
  const response = input.tool_response || {};
  const lowerTool = tool.toLowerCase();
  const failed =
    response.success === false ||
    response.error ||
    response.is_error ||
    response.status === "error" ||
    input.error;

  if (event === "SessionStart") return { state: "listening", label: "waking", tool };
  if (event === "SessionEnd") return { state: "sleeping", label: "sleeping", tool };
  if (event === "UserPromptSubmit") return { state: "listening", label: "listening", tool };
  if (event === "Notification") return { state: "waiting", label: "waiting", tool };
  if (event === "Stop" || event === "SubagentStop") {
    return { state: "success", label: event === "SubagentStop" ? "agent done" : "done", tool };
  }
  if (event === "PreToolUse") {
    if (lowerTool.includes("bash")) {
      const kind = bashKind(commandFromInput(input));
      if (kind === "testing") return { state: "testing", label: "testing", tool };
      if (kind === "installing") return { state: "installing", label: "installing", tool };
      if (kind === "git") return { state: "git", label: "git", tool };
      if (kind === "reviewing") return { state: "reviewing", label: "reviewing", tool };
      return { state: "running", label: "running shell", tool };
    }
    if (lowerTool.includes("write") || lowerTool.includes("edit")) {
      return { state: "editing", label: "editing", tool };
    }
    if (lowerTool.includes("read") || lowerTool.includes("grep") || lowerTool.includes("glob")) {
      return { state: "searching", label: "searching", tool };
    }
    if (lowerTool.includes("web")) return { state: "browsing", label: "browsing", tool };
    if (lowerTool.includes("task")) return { state: "delegating", label: "delegating", tool };
    return { state: "tool", label: "using tool", tool };
  }
  if (event === "PostToolUse") {
    return failed
      ? { state: "error", label: "tool failed", tool }
      : { state: "success", label: "tool done", tool };
  }
  if (event === "PreCompact") return { state: "compacting", label: "compacting", tool };
  return { state: "thinking", label: "thinking", tool };
}

function toolKind(toolName) {
  const lowerTool = String(toolName || "").toLowerCase();
  if (lowerTool.includes("bash")) return "shell";
  if (lowerTool.includes("write") || lowerTool.includes("edit")) return "edit";
  if (lowerTool.includes("read") || lowerTool.includes("grep") || lowerTool.includes("glob")) return "search";
  if (lowerTool.includes("web")) return "web";
  if (lowerTool.includes("task")) return "delegate";
  return toolName ? "tool" : "";
}

function commandFromInput(input) {
  return (
    input.tool_input?.command ||
    input.tool_input?.cmd ||
    input.tool_input?.script ||
    input.input?.command ||
    input.command ||
    ""
  );
}

function bashKind(command) {
  const text = String(command || "").toLowerCase();
  if (/\b(npm|pnpm|yarn|bun)\s+(test|run test)|\b(pytest|cargo test|go test|vitest|jest)\b/.test(text)) return "testing";
  if (/\b(npm|pnpm|yarn|bun)\s+(install|add)|\b(pip|uv)\s+install\b|\bcargo add\b/.test(text)) return "installing";
  if (/\bgit\s+(status|diff|show|log)\b/.test(text)) return "reviewing";
  if (/\bgit\s+/.test(text)) return "git";
  return "shell";
}

function dayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function pruneState(state, now = nowMs()) {
  const maxAge = 7 * 24 * 60 * 60 * 1000;
  const sessions = Object.entries(state.sessions || {})
    .filter(([, value]) => !value.updated_at || now - value.updated_at <= maxAge)
    .sort((a, b) => (b[1].updated_at || 0) - (a[1].updated_at || 0))
    .slice(0, 50);
  const daily = Object.fromEntries(
    Object.entries(state.daily || {})
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 30)
      .sort(([a], [b]) => a.localeCompare(b))
  );
  return {
    ...state,
    sessions: Object.fromEntries(sessions),
    daily
  };
}

function updateStats(previous, input, status, now = nowMs()) {
  const previousStats = previous?.stats || {};
  const stats = {
    started_at: previousStats.started_at || now,
    tools: previousStats.tools || 0,
    edits: previousStats.edits || 0,
    searches: previousStats.searches || 0,
    shells: previousStats.shells || 0,
    delegates: previousStats.delegates || 0,
    tests: previousStats.tests || 0,
    installs: previousStats.installs || 0,
    git: previousStats.git || 0,
    failures: previousStats.failures || 0,
    recoveries: previousStats.recoveries || 0,
    success_streak: previousStats.success_streak || 0,
    best_success_streak: previousStats.best_success_streak || 0,
    last_tool_at: previousStats.last_tool_at || 0,
    last_result: previousStats.last_result || "",
    tool_counts: { ...(previousStats.tool_counts || {}) }
  };

  if (input.hook_event_name === "PreToolUse") {
    const kind = toolKind(input.tool_name);
    const bash = kind === "shell" ? bashKind(commandFromInput(input)) : "";
    const tool = input.tool_name || "tool";
    stats.tools += 1;
    stats.last_tool_at = now;
    stats.tool_counts[tool] = (stats.tool_counts[tool] || 0) + 1;
    if (kind === "edit") stats.edits += 1;
    if (kind === "search" || kind === "web") stats.searches += 1;
    if (kind === "shell") stats.shells += 1;
    if (kind === "delegate") stats.delegates += 1;
    if (bash === "testing") stats.tests += 1;
    if (bash === "installing") stats.installs += 1;
    if (bash === "git" || bash === "reviewing") stats.git += 1;
  }

  if (input.hook_event_name === "PostToolUse") {
    if (status.state === "error") {
      stats.failures += 1;
      stats.success_streak = 0;
      stats.last_result = "error";
    } else {
      if (stats.last_result === "error") stats.recoveries += 1;
      stats.success_streak += 1;
      stats.best_success_streak = Math.max(stats.best_success_streak || 0, stats.success_streak);
      stats.last_result = "success";
    }
  }

  return stats;
}

function topTool(toolCounts = {}) {
  const entries = Object.entries(toolCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return entries[0] ? { name: entries[0][0], count: entries[0][1] } : null;
}

function randomHash(seed) {
  const text = String(seed || "");
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash;
}

const RANDOM_EVENTS = [
  { id: "stretch", en: "tiny stretch", zh: "伸了个小懒腰", mood: "rested" },
  { id: "sniff", en: "sniffed the diff", zh: "闻了闻 diff", mood: "curious" },
  { id: "spark", en: "found a tiny spark", zh: "捡到一点火花", mood: "happy" },
  { id: "tea", en: "tea break queued", zh: "预约一口热茶", mood: "fresh" },
  { id: "bookmark", en: "bookmarked a clue", zh: "把线索夹好", mood: "curious" },
  { id: "rubber-duck", en: "quietly rubber-ducking", zh: "小声陪你理思路", mood: "focused" }
];

function randomEventFor(previous, status, config, now = nowMs()) {
  const chance = Number(config.randomEventChance || 0);
  if (chance <= 0 || status.state === "idle" || status.state === "sleeping") return null;
  const stats = previous?.stats || {};
  const eventCount = (previous?.events || []).length;
  const seed = `${previous?.session_id || ""}:${status.state}:${stats.tools || 0}:${stats.failures || 0}:${eventCount}`;
  const value = (randomHash(seed) % 1000) / 1000;
  if (value >= chance) return null;
  const item = RANDOM_EVENTS[randomHash(`${seed}:event`) % RANDOM_EVENTS.length];
  return {
    ...item,
    at: now,
    state: status.state
  };
}

function accumulateDaily(previousDaily, input, status, now = nowMs(), previous = {}, updated = {}, randomEvent = null) {
  const key = dayKey(new Date(now));
  const daily = { ...(previousDaily || {}) };
  const item = {
    date: key,
    tools: daily[key]?.tools || 0,
    edits: daily[key]?.edits || 0,
    searches: daily[key]?.searches || 0,
    shells: daily[key]?.shells || 0,
    tests: daily[key]?.tests || 0,
    installs: daily[key]?.installs || 0,
    git: daily[key]?.git || 0,
    failures: daily[key]?.failures || 0,
    successes: daily[key]?.successes || 0,
    recoveries: daily[key]?.recoveries || 0,
    best_streak: daily[key]?.best_streak || 0,
    tool_counts: { ...(daily[key]?.tool_counts || {}) },
    moods: { ...(daily[key]?.moods || {}) },
    events: Array.isArray(daily[key]?.events) ? [...daily[key].events] : []
  };
  if (input.hook_event_name === "PreToolUse") {
    const kind = toolKind(input.tool_name);
    const bash = kind === "shell" ? bashKind(commandFromInput(input)) : "";
    const tool = input.tool_name || "tool";
    item.tools += 1;
    item.tool_counts[tool] = (item.tool_counts[tool] || 0) + 1;
    if (kind === "edit") item.edits += 1;
    if (kind === "search" || kind === "web") item.searches += 1;
    if (kind === "shell") item.shells += 1;
    if (bash === "testing") item.tests += 1;
    if (bash === "installing") item.installs += 1;
    if (bash === "git" || bash === "reviewing") item.git += 1;
  }
  if (input.hook_event_name === "PostToolUse") {
    if (status.state === "error") item.failures += 1;
    else {
      item.successes += 1;
      if (previous?.stats?.last_result === "error") item.recoveries += 1;
    }
  }
  const mood = moodFor(updated, now);
  if (mood) item.moods[mood] = (item.moods[mood] || 0) + 1;
  item.best_streak = Math.max(item.best_streak || 0, updated?.stats?.success_streak || 0);
  if (randomEvent) item.events = [...item.events, randomEvent].slice(-12);
  const top = topTool(item.tool_counts);
  item.top_tool = top ? top.name : "";
  daily[key] = item;
  return daily;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function defaultCare(now = nowMs()) {
  return {
    energy: 80,
    affection: 50,
    snacks: 0,
    play: 0,
    naps: 0,
    last_interaction: now
  };
}

function careFor(previous, now = nowMs()) {
  const base = { ...defaultCare(now), ...(previous?.care || {}) };
  const hours = Math.max(0, (now - (base.last_interaction || now)) / 3_600_000);
  return {
    ...base,
    energy: clamp(Math.round(base.energy - hours * 2), 0, 100),
    affection: clamp(Math.round(base.affection - hours), 0, 100)
  };
}

const GROWTH_LEVELS = [
  { level: 1, xp: 0, en: "hatchling", zh: "新来的", unlock: "basic-care" },
  { level: 2, xp: 40, en: "helper", zh: "小助手", unlock: "care-hints" },
  { level: 3, xp: 120, en: "companion", zh: "老搭档", unlock: "mood-diary" },
  { level: 4, xp: 260, en: "copilot", zh: "王牌搭子", unlock: "random-events" },
  { level: 5, xp: 500, en: "legend", zh: "传说搭子", unlock: "tiny-legend" }
];

function defaultGrowth(now = nowMs()) {
  return {
    xp: 0,
    level: 1,
    unlocks: ["basic-care"],
    log: [],
    updated_at: now
  };
}

function growthFor(profile = {}, now = nowMs()) {
  const growth = { ...defaultGrowth(now), ...(profile.growth || {}) };
  const levelInfo = [...GROWTH_LEVELS].reverse().find((item) => growth.xp >= item.xp) || GROWTH_LEVELS[0];
  const unlocks = new Set(Array.isArray(growth.unlocks) ? growth.unlocks : []);
  for (const item of GROWTH_LEVELS) {
    if (growth.xp >= item.xp) unlocks.add(item.unlock);
  }
  return {
    ...growth,
    level: levelInfo.level,
    unlocks: [...unlocks],
    updated_at: now
  };
}

function growthXpForEvent(input, status, previous = {}) {
  if (input.hook_event_name === "PreToolUse") {
    const kind = toolKind(input.tool_name);
    if (kind === "edit") return 3;
    if (kind === "search" || kind === "web") return 2;
    if (kind === "shell") return 2;
    if (kind === "delegate") return 3;
    return 1;
  }
  if (input.hook_event_name === "PostToolUse") {
    if (status.state === "error") return 1;
    return previous?.stats?.last_result === "error" ? 8 : 4;
  }
  if (input.hook_event_name === "UserPromptSubmit") return 1;
  if (input.hook_event_name === "Stop" || input.hook_event_name === "SubagentStop") return 3;
  return 0;
}

function applyGrowth(profile = {}, xp, reason, now = nowMs()) {
  const before = growthFor(profile, now);
  const nextXp = Math.max(0, before.xp + Math.max(0, Number(xp) || 0));
  const afterBase = {
    ...before,
    xp: nextXp
  };
  const after = growthFor({ growth: afterBase }, now);
  const log = Array.isArray(before.log) ? before.log.slice(-19) : [];
  if (xp > 0) {
    log.push({
      at: now,
      xp,
      reason,
      level: after.level
    });
  }
  if (after.level > before.level) {
    log.push({
      at: now,
      xp: 0,
      reason: `level-up:${after.level}`,
      level: after.level
    });
  }
  return {
    ...after,
    log: log.slice(-20),
    updated_at: now
  };
}

function updateCare(previous, input, status, now = nowMs()) {
  const care = careFor(previous, now);
  if (input.hook_event_name === "PreToolUse") {
    care.energy = clamp(care.energy - 1, 0, 100);
  }
  if (status.state === "success") {
    care.affection = clamp(care.affection + 1, 0, 100);
  }
  if (status.state === "error") {
    care.energy = clamp(care.energy - 2, 0, 100);
    care.affection = clamp(care.affection - 1, 0, 100);
  }
  care.last_interaction = now;
  return care;
}

function applyCareAction(care, action, now = nowMs()) {
  const next = { ...defaultCare(now), ...(care || {}) };
  if (action === "feed") {
    next.energy = clamp(next.energy + 18, 0, 100);
    next.affection = clamp(next.affection + 3, 0, 100);
    next.snacks = (next.snacks || 0) + 1;
  } else if (action === "play") {
    next.energy = clamp(next.energy - 8, 0, 100);
    next.affection = clamp(next.affection + 12, 0, 100);
    next.play = (next.play || 0) + 1;
  } else if (action === "nap") {
    next.energy = clamp(next.energy + 28, 0, 100);
    next.naps = (next.naps || 0) + 1;
  } else if (action === "pet") {
    next.affection = clamp(next.affection + 8, 0, 100);
  }
  next.last_interaction = now;
  return next;
}

function growthXpForAction(action) {
  if (action === "feed") return 6;
  if (action === "play") return 8;
  if (action === "pet") return 5;
  if (action === "nap") return 4;
  return 0;
}

function bar(value, width = 10, filled = "▰", empty = "▱") {
  const safe = clamp(Number(value) || 0, 0, 100);
  const size = Math.max(1, Number(width) || 10);
  const count = Math.round((safe / 100) * size);
  return `${filled.repeat(count)}${empty.repeat(size - count)}`;
}

function petLevel(status) {
  const growth = growthFor({ growth: status.growth });
  const names = Object.fromEntries(GROWTH_LEVELS.map((item) => [item.level, { en: item.en, zh: item.zh }]));
  return { level: growth.level, names: names[growth.level], xp: growth.xp, unlocks: growth.unlocks };
}

const PALETTES = {
  mono: {
    pet: "0",
    label: "0",
    mood: "0",
    tool: "0",
    muted: "0",
    success: "0",
    error: "0",
    flair: "0"
  },
  classic: {
    pet: "36",
    label: "33",
    mood: "35",
    tool: "90",
    muted: "90",
    success: "32",
    error: "31",
    flair: "36"
  },
  soft: {
    pet: "38;5;110",
    label: "38;5;180",
    mood: "38;5;175",
    tool: "38;5;245",
    muted: "38;5;244",
    success: "38;5;114",
    error: "38;5;203",
    flair: "38;5;109"
  },
  terminal: {
    pet: "32",
    label: "92",
    mood: "36",
    tool: "90",
    muted: "90",
    success: "92",
    error: "91",
    flair: "32"
  },
  alert: {
    pet: "36",
    label: "37",
    mood: "33",
    tool: "90",
    muted: "90",
    success: "32",
    error: "1;31",
    flair: "35"
  }
};

function palette(name) {
  return PALETTES[name] || PALETTES.classic;
}

function deterministicPick(items, seed) {
  if (!Array.isArray(items) || items.length === 0) return "";
  const text = String(seed || "");
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return items[hash % items.length];
}

function shouldShowFlair(config, status) {
  const chance = Number(config.flairChance ?? 0);
  if (chance <= 0 || status.state === "idle") return false;
  const seed = `${status.session_id || ""}:${status.state}:${status.updated_at || ""}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 33 + seed.charCodeAt(i)) >>> 0;
  return (hash % 1000) / 1000 < chance;
}

function moodFor(status, now = nowMs()) {
  const stats = status.stats || {};
  const care = careFor(status, now);
  const age = now - (status.updated_at || 0);
  if (care.energy <= 15) return "tired";
  if (care.affection >= 85) return "happy";
  if (care.affection <= 15) return "lonely";
  if (stats.failures >= 3) return "frazzled";
  if (stats.tests >= 3) return "proud";
  if (stats.shells >= 5) return "wired";
  if (stats.searches >= 5) return "curious";
  if (status.state === "error" || stats.failures >= 2) return "careful";
  if (stats.success_streak >= 3) return "confident";
  if (["running", "editing", "searching", "browsing", "delegating", "tool"].includes(status.state) && stats.tools >= 5) {
    return "busy";
  }
  if (status.state === "idle" && age > 10 * 60 * 1000) return "sleepy";
  if (stats.tools > 0 && ["running", "editing", "searching", "browsing", "thinking"].includes(status.state)) return "focused";
  if (status.state === "listening") return "fresh";
  return "";
}

function validatePet(pet) {
  const required = ["idle", "listening", "thinking", "tool", "success", "error", "waiting", "sleeping"];
  const errors = [];
  if (!pet || typeof pet !== "object") return ["Pet must be a JSON object"];
  if (!pet.name || typeof pet.name !== "string") errors.push("Missing string field: name");
  if (pet.name && pet.name.length > 64) errors.push("Field name must be 64 characters or fewer");
  if (!pet.states || typeof pet.states !== "object") errors.push("Missing object field: states");
  for (const state of required) {
    if (!Array.isArray(pet.states?.[state]) || pet.states[state].some((frame) => typeof frame !== "string")) {
      errors.push(`State ${state} must be an array of strings`);
    }
    if (Array.isArray(pet.states?.[state]) && pet.states[state].some((frame) => frame.length > 80)) {
      errors.push(`State ${state} frames must be 80 characters or fewer`);
    }
    if (Array.isArray(pet.states?.[state]) && pet.states[state].length > 12) {
      errors.push(`State ${state} must have 12 frames or fewer`);
    }
  }
  if (pet.color && typeof pet.color !== "string") errors.push("Optional field color must be a string");
  return errors;
}

function achievementsFor(status, config = {}) {
  const stats = status.stats || {};
  const care = careFor(status);
  const achievements = [];
  if ((care.snacks || 0) > 0) achievements.push("first-snack");
  if ((care.play || 0) > 0) achievements.push("play-break");
  if ((stats.success_streak || 0) >= 5) achievements.push("steady-streak");
  if ((stats.searches || 0) >= 20) achievements.push("clue-hunter");
  if ((stats.edits || 0) >= 10) achievements.push("code-gardener");
  if ((stats.shells || 0) >= 10) achievements.push("terminal-runner");
  if (care.energy >= 100) achievements.push("full-energy");
  if (care.affection >= 100) achievements.push("full-bond");
  if ((status.growth?.level || 1) >= 3) achievements.push("growing-companion");
  if ((status.growth?.level || 1) >= 5) achievements.push("tiny-legend");
  if (config.language === "zh") achievements.push("chinese-mode");
  if (config.style === "powerline") achievements.push("powerline");
  return achievements;
}

function stripAnsi(input) {
  return String(input || "").replace(/\x1b\[[0-9;]*m/g, "");
}

function isCombining(codePoint) {
  return (
    (codePoint >= 0x0300 && codePoint <= 0x036f) ||
    (codePoint >= 0x1ab0 && codePoint <= 0x1aff) ||
    (codePoint >= 0x1dc0 && codePoint <= 0x1dff) ||
    (codePoint >= 0x20d0 && codePoint <= 0x20ff) ||
    (codePoint >= 0xfe20 && codePoint <= 0xfe2f)
  );
}

function charWidth(char) {
  const codePoint = char.codePointAt(0);
  if (!codePoint || codePoint < 32 || (codePoint >= 0x7f && codePoint < 0xa0)) return 0;
  if (isCombining(codePoint)) return 0;
  if (
    codePoint >= 0x1100 &&
    (codePoint <= 0x115f ||
      codePoint === 0x2329 ||
      codePoint === 0x232a ||
      (codePoint >= 0x2e80 && codePoint <= 0xa4cf && codePoint !== 0x303f) ||
      (codePoint >= 0xac00 && codePoint <= 0xd7a3) ||
      (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
      (codePoint >= 0xfe10 && codePoint <= 0xfe19) ||
      (codePoint >= 0xfe30 && codePoint <= 0xfe6f) ||
      (codePoint >= 0xff00 && codePoint <= 0xff60) ||
      (codePoint >= 0xffe0 && codePoint <= 0xffe6) ||
      (codePoint >= 0x1f300 && codePoint <= 0x1faff))
  ) {
    return 2;
  }
  return 1;
}

function displayWidth(input) {
  let width = 0;
  for (const char of stripAnsi(input)) width += charWidth(char);
  return width;
}

function truncate(input, width) {
  const text = String(input || "");
  if (displayWidth(text) <= width) return text;
  if (width <= 1) return "";

  let output = "";
  let currentWidth = 0;
  for (let i = 0; i < text.length; ) {
    const ansi = text.slice(i).match(/^\x1b\[[0-9;]*m/);
    if (ansi) {
      output += ansi[0];
      i += ansi[0].length;
      continue;
    }
    const char = Array.from(text.slice(i))[0];
    const nextWidth = currentWidth + charWidth(char);
    if (nextWidth > width - 1) break;
    output += char;
    currentWidth = nextWidth;
    i += char.length;
  }
  const reset = /\x1b\[[0-9;]*m/.test(output) && !output.endsWith("\x1b[0m") ? "\x1b[0m" : "";
  return `${output}${reset}…`;
}

function basename(filePath) {
  if (!filePath) return "";
  return path.basename(filePath);
}

function color(text, code, enabled) {
  if (!enabled || process.env.NO_COLOR) return text;
  return `\x1b[${code}m${text}\x1b[0m`;
}

function shellEscapeSingle(value) {
  return String(value).replace(/'/g, "'\\''");
}

module.exports = {
  availablePets,
  basename,
  bundledPets,
  color,
  configPath,
  dataDir,
  defaultConfig,
  displayWidth,
  ensureDir,
  formatPetValidationError,
  achievementsFor,
  accumulateDaily,
  bar,
  bashKind,
  commandFromInput,
  compactConfig,
  deterministicPick,
  installedPets,
  applyGrowth,
  isSafePetId,
  listPetsInDir,
  loadConfig,
  loadPet,
  mergeConfig,
  normalizeConfig,
  locale,
  moodFor,
  nowMs,
  palette,
  petExists,
  petLevel,
  pruneState,
  dayKey,
  pluginRoot,
  readJson,
  readJsonDetailed,
  readStdinJson,
  randomEventFor,
  growthFor,
  growthXpForAction,
  growthXpForEvent,
  GROWTH_LEVELS,
  sessionKey,
  shouldShowFlair,
  shellEscapeSingle,
  statePath,
  statusFromHook,
  truncate,
  translate,
  topTool,
  applyCareAction,
  careFor,
  updateStats,
  updateCare,
  validateConfiguredPets,
  validatePet,
  writeJsonAtomic
};
