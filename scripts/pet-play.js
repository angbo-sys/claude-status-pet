#!/usr/bin/env node

const path = require("path");
const {
  applyCareAction,
  applyGrowth,
  bar,
  careFor,
  dataDir,
  ensureDir,
  loadConfig,
  nowMs,
  readJson,
  statePath,
  petLevel,
  growthXpForAction,
  translate,
  writeJsonAtomic
} = require("./pet-lib");

const ACTIONS = new Set(["feed", "play", "nap", "pet", "status"]);

function argValue(flag, fallback) {
  const idx = process.argv.indexOf(flag);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function actionMessage(action, care, language) {
  const t = (key) => translate(language, "care", key);
  if (action !== "status") {
    return `${t(action)} ${t("energy")} ${care.energy}/100, ${t("bond")} ${care.affection}/100.`;
  }
  return `${t("status")}: ${t("energy")} ${care.energy}/100, ${t("bond")} ${care.affection}/100, ${t("snacks")} ${care.snacks || 0}, ${t("plays")} ${care.play || 0}, ${t("naps")} ${care.naps || 0}.`;
}

function panel(previous, care, language) {
  const stats = previous.stats || {};
  const level = petLevel({ ...previous, care });
  const levelName = level.names?.[language] || level.names?.en || "helper";
  const isZh = language === "zh";
  const lines = [
    isZh ? "宠物状态" : "Pet Status",
    `${isZh ? "阶段" : "Level"}: Lv.${level.level} ${levelName}`,
    `${isZh ? "经验" : "XP"}: ${level.xp || 0}`,
    `${isZh ? "能量" : "Energy"}: ${bar(care.energy)} ${care.energy}/100`,
    `${isZh ? "亲密度" : "Bond"}:   ${bar(care.affection)} ${care.affection}/100`,
    `${isZh ? "当前" : "Now"}: ${previous.label || previous.state || "idle"}`,
    `${isZh ? "会话" : "Session"}: ${stats.tools || 0} ${isZh ? "步" : "moves"} · ${stats.edits || 0} ${isZh ? "编辑" : "edits"} · ${stats.searches || 0} ${isZh ? "搜索" : "searches"} · ${stats.failures || 0} ${isZh ? "失败" : "fails"}`,
    `${isZh ? "照顾" : "Care"}: ${care.snacks || 0} ${isZh ? "零食" : "snacks"} · ${care.play || 0} ${isZh ? "玩耍" : "play"} · ${care.naps || 0} ${isZh ? "小睡" : "naps"}`
  ];
  return lines.join("\n");
}

function main() {
  const action = process.argv[2] || "status";
  const config = loadConfig();
  if (!ACTIONS.has(action)) {
    console.error("Usage: pet-play.js feed|play|nap|pet|status");
    process.exit(1);
  }

  const state = readJson(statePath(), { sessions: {} });
  state.sessions = state.sessions || {};
  const key = hasFlag("--session") ? argValue("--session", "default") : state.latest_session_id || "default";
  const profile = state.pet || {};
  const previous = state.sessions[key] || {
    session_id: key,
    state: "idle",
    label: "idle",
    care: profile.care,
    growth: profile.growth,
    events: profile.events,
    random_event: profile.random_event
  };
  const updatedAt = nowMs();
  const care = action === "status" ? careFor(previous, updatedAt) : applyCareAction(previous.care, action, updatedAt);
  const growth = action === "status"
    ? previous.growth || state.pet?.growth
    : applyGrowth(state.pet || previous, growthXpForAction(action), action, updatedAt);

  state.sessions[key] = {
    ...previous,
    care,
    growth,
    updated_at: updatedAt,
    state: action === "nap" ? "sleeping" : previous.state || "idle",
    label: action === "nap" ? "napping" : previous.label || "idle"
  };
  state.pet = {
    ...(state.pet || {}),
    care,
    growth,
    events: previous.events || state.pet?.events || [],
    random_event: previous.random_event || state.pet?.random_event || null,
    updated_at: updatedAt
  };
  state.latest_session_id = key;
  state.updated_at = updatedAt;

  ensureDir(path.dirname(statePath()));
  writeJsonAtomic(statePath(), state);
  console.log(action === "status" ? panel({ ...previous, growth }, care, config.language) : actionMessage(action, care, config.language));
  console.log(`${translate(config.language, "care", "dataDir")}: ${dataDir()}`);
}

main();
