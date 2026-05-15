#!/usr/bin/env node

const { execFileSync } = require("child_process");
const {
  basename, careFor, color, deterministicPick, loadConfig, loadPet, moodFor, nowMs,
  palette, readJson, readStdinJson, sessionKey, shouldShowFlair, statePath, translate, truncate
} = require("./pet-lib");

const FRAME_MS = 360;
const RECENT_SUCCESS_MS = 3500;
const STALE_ACTIVE_MS = 90_000;
const ACTIVE_STATES = [
  "tool", "thinking", "listening", "waiting", "running", "testing",
  "installing", "git", "reviewing", "editing", "searching", "browsing",
  "delegating", "compacting"
];
const STATE_FALLBACKS = {
  running: "tool", testing: "tool", installing: "tool", git: "tool",
  reviewing: "thinking", editing: "tool", delegating: "tool",
  searching: "thinking", browsing: "thinking", compacting: "thinking"
};

function activeStatus(input, state) {
  const key = sessionKey(input);
  const sessions = state.sessions || {};
  const status = sessions[key] || sessions[state.latest_session_id] || {};
  const age = nowMs() - (status.updated_at || 0);
  if (!status.state) return { state: "idle", label: "idle", updated_at: nowMs() };
  if (status.state === "success" && age > RECENT_SUCCESS_MS) return { ...status, state: "idle", label: "idle" };
  if (ACTIVE_STATES.includes(status.state) && age > STALE_ACTIVE_MS) return { ...status, state: "idle", label: "idle" };
  return status;
}

function frameFor(pet, stateName) {
  const fallbackState = STATE_FALLBACKS[stateName];
  const frames = pet.states[stateName] || pet.states[fallbackState] || pet.states.idle || ["[o_o]"];
  const idx = Math.floor(nowMs() / FRAME_MS) % frames.length;
  return frames[idx];
}

function companionFrame(config, status) {
  if (!config.companionPet) return "";
  const pet = loadPet(config.companionPet);
  return frameFor(pet, status.state);
}

function gitBranch(cwd) {
  if (!cwd) return "";
  try {
    return execFileSync("git", ["branch", "--show-current"], {
      cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 80
    }).trim();
  } catch { return ""; }
}

function gitChanges(cwd) {
  if (!cwd) return "";
  try {
    const output = execFileSync("git", ["status", "--short"], {
      cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 100
    }).trim();
    if (!output) return "clean";
    const lines = output.split("\n").filter(Boolean);
    const staged = lines.filter((line) => line[0] && line[0] !== " " && line[0] !== "?").length;
    const unstaged = lines.filter((line) => line[1] && line[1] !== " ").length;
    const untracked = lines.filter((line) => line.startsWith("??")).length;
    return `+${staged} ~${unstaged} ?${untracked}`;
  } catch { return ""; }
}

function costLabel(input) {
  const cost = input.cost || {};
  const usd = Number(cost.total_cost_usd || 0);
  if (!Number.isFinite(usd) || usd <= 0) return "";
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(2)}`;
}

function elapsedLabel(input) {
  const ms = Number(input.cost?.total_duration_ms || 0);
  if (!Number.isFinite(ms) || ms <= 0) return "";
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest ? `${minutes}m${rest}s` : `${minutes}m`;
}

function pathLabel(filePath, segments) {
  if (!filePath) return "";
  const parts = filePath.split(/[\/]+/).filter(Boolean);
  const count = Math.max(1, Number(segments || 1));
  const tail = parts.slice(-count).join("/");
  return parts.length > count ? `.../${tail}` : tail || basename(filePath);
}

function progressBar(percent, width) {
  const size = Math.max(4, Number(width || 8));
  const value = Math.max(0, Math.min(100, Number(percent || 0)));
  const filled = Math.round((value / 100) * size);
  return `[${"█".repeat(filled)}${"░".repeat(size - filled)}]`;
}

function contextLabel(input, config) {
  const raw = input.context_window?.used_percentage ?? input.context_window?.percentage ?? input.context?.used_percentage ?? input.context?.percentage;
  const percent = Number(raw);
  if (!Number.isFinite(percent) || percent <= 0) return "";
  return `${progressBar(percent, config.contextBarWidth)} ${Math.round(percent)}% ${translate(config.language, "units", "ctx")}`;
}

function taskLabel(input, config) {
  const tasks = Array.isArray(input.tasks) ? input.tasks : [];
  if (!tasks.length) return "";
  const active = tasks.filter((task) => !["done", "completed", "failed"].includes(String(task.status || "").toLowerCase())).length;
  const unit = translate(config.language, "units", "tasks");
  return active ? `${active}/${tasks.length} ${unit}` : `${tasks.length} ${unit}`;
}

function versionLabel(input) {
  return input.version || input.claude_version || input.app_version || "";
}

function statsLabel(status, config) {
  const stats = status.stats || {};
  const parts = [];
  if (stats.tools) parts.push(`${stats.tools} ${translate(config.language, "units", "moves")}`);
  if (stats.edits) parts.push(`${stats.edits} ${translate(config.language, "units", "edits")}`);
  if (stats.failures) parts.push(`${stats.failures} ${translate(config.language, "units", "fails")}`);
  if (stats.success_streak >= 3) parts.push(`${translate(config.language, "units", "streak")} ${stats.success_streak}`);
  return parts.slice(0, 2).join(" · ");
}

function vitalBar(value, label) {
  const filled = Math.round((Math.max(0, Math.min(100, value)) / 100) * 5);
  return `${label}${"▰".repeat(filled)}${"▱".repeat(5 - filled)}`;
}

function vitalsLabel(status, config) {
  const care = careFor(status);
  return `${vitalBar(care.energy, translate(config.language, "units", "energy"))} ${vitalBar(care.affection, translate(config.language, "units", "bond"))}`;
}

function petNameLabel(config, pet) {
  return config.petName || pet.name || "";
}

function flairLabel(pet, status, mood, config) {
  if (!config.show?.flair || !pet.personality || !shouldShowFlair(config, status)) return "";
  const personality = config.language === "zh" && pet.personality_zh ? pet.personality_zh : pet.personality;
  const options = personality[status.state] || personality[mood] || personality.default;
  return deterministicPick(options, `${status.session_id}:${status.state}:${status.updated_at}`);
}

function careHint(status, config) {
  const chance = Number(config.careHintChance || 0);
  if (chance <= 0) return "";
  const care = careFor(status);
  const hints = config.language === "zh"
    ? { tired: ["能量低，想小睡", "喂我一点？"], lonely: ["摸摸我？", "陪我一下嘛"], frazzled: ["慢一点，先看错误"], happy: ["状态很好！"] }
    : { tired: ["low energy, nap?", "snack maybe?"], lonely: ["tiny pat?", "stay with me?"], frazzled: ["slow down, read the error"], happy: ["feeling great"] };
  const mood = moodFor(status);
  const key = care.energy < 20 ? "tired" : care.affection < 20 ? "lonely" : mood;
  const options = hints[key];
  if (!options) return "";
  const seed = `${status.session_id}:${status.updated_at}:${key}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 37 + seed.charCodeAt(i)) >>> 0;
  if ((hash % 1000) / 1000 > chance) return "";
  return deterministicPick(options, seed);
}

function minutesOfDay(value) {
  const match = String(value || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function inQuietHours(ranges) {
  if (!Array.isArray(ranges) || !ranges.length) return false;
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  return ranges.some((range) => {
    const start = minutesOfDay(range.start);
    const end = minutesOfDay(range.end);
    if (start === null || end === null || start === end) return false;
    if (start < end) return current >= start && current < end;
    return current >= start || current < end;
  });
}

function partsForMode(mode, values) {
  if (mode === "quiet") return [values.petFrame];
  if (mode === "compact") return [values.petAndLabel, values.tool || values.cwd].filter(Boolean);
  if (mode === "full") {
    return [values.customText, values.petName, values.petAndLabel, values.companion, values.mood, values.tool, values.model, values.version, values.cwd, values.git, values.gitChanges, values.context, values.tasks, values.vitals, values.elapsed, values.cost, values.stats, values.flair, values.hint].filter(Boolean);
  }
  return [values.customText, values.petName, values.petAndLabel, values.companion, values.mood, values.tool, values.model, values.cwd, values.git, values.context, values.tasks, values.vitals, values.stats, values.flair, values.hint].filter(Boolean);
}

function separatorFor(config) {
  if (config.style === "powerline") return " ";
  return config.separator || " · ";
}

function main() {
  const input = readStdinJson();
  const config = loadConfig();
  const pet = loadPet(process.env.CLAUDE_STATUS_PET || config.pet || "byte");
  const state = readJson(statePath(), { sessions: {} });
  const status = activeStatus(input, state);
  const colors = config.colors !== false;
  const colorset = palette(config.palette);
  const mood = moodFor(status);
  const quiet = inQuietHours(config.quietHours);
  const lowEnergy = careFor(status).energy < 15;

  const petFrame = color(frameFor(pet, status.state), pet.color || colorset.pet, colors);
  const labelCode = status.state === "error" ? colorset.error : status.state === "success" ? colorset.success : colorset.label;
  const rawLabel = status.label || status.state || "idle";
  const label = config.show?.label === false ? "" : color(translate(config.language, "labels", rawLabel), labelCode, colors);
  const values = {
    petFrame, companion: "", petName: "",
    petAndLabel: label ? `${petFrame} ${label}` : petFrame,
    mood: config.show?.mood && mood ? color(translate(config.language, "moods", mood), colorset.mood, colors) : "",
    tool: "", model: "", version: "", cwd: "", git: "", gitChanges: "", context: "", tasks: "", vitals: "", elapsed: "", cost: "", stats: "", flair: "", hint: "",
    customText: config.customText ? color(config.customText, colorset.flair, colors) : ""
  };

  if (config.show?.petName) values.petName = color(petNameLabel(config, pet), colorset.flair, colors);
  values.companion = color(companionFrame(config, status), colorset.muted, colors);
  if (config.show?.tool && status.tool) values.tool = color(status.tool, colorset.tool, colors);
  if (config.show?.model && input.model?.display_name) values.model = input.model.display_name;
  if (config.show?.version) values.version = versionLabel(input);
  if (config.show?.cwd) {
    const dir = input.workspace?.current_dir || input.cwd || status.cwd;
    if (dir) values.cwd = pathLabel(dir, config.cwdSegments);
  }
  const cwd = input.workspace?.current_dir || input.cwd || status.cwd;
  if (config.show?.git) {
    const branch = gitBranch(cwd);
    if (branch) values.git = color(`git:${branch}`, colorset.muted, colors);
  }
  if (config.show?.gitChanges) {
    const changes = gitChanges(cwd);
    if (changes) values.gitChanges = color(changes === "clean" ? translate(config.language, "units", "clean") : changes, changes === "clean" ? colorset.success : colorset.mood, colors);
  }
  if (config.show?.context) values.context = color(contextLabel(input, config), colorset.muted, colors);
  if (config.show?.tasks) values.tasks = color(taskLabel(input, config), colorset.muted, colors);
  if (config.show?.petVitals) values.vitals = color(vitalsLabel(status, config), colorset.muted, colors);
  if (config.show?.elapsed) { const elapsed = elapsedLabel(input); if (elapsed) values.elapsed = elapsed; }
  if (config.show?.cost) { const cost = costLabel(input); if (cost) values.cost = cost; }
  if (config.show?.stats) values.stats = color(statsLabel(status, config), colorset.muted, colors);
  values.flair = quiet || lowEnergy ? "" : color(flairLabel(pet, status, mood, config), colorset.flair, colors);
  values.hint = quiet ? "" : color(careHint(status, config), colorset.flair, colors);

  const columns = Number(input.columns || process.env.COLUMNS || 0);
  const maxWidth = Math.max(40, Math.min(columns || config.maxWidth || 120, config.maxWidth || 120));
  const parts = partsForMode(config.displayMode || "balanced", values);
  process.stdout.write(`${truncate(parts.join(separatorFor(config)), maxWidth)}\n`);
}

main();
