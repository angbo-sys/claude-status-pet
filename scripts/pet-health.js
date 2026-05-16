#!/usr/bin/env node

const fs = require("fs");
const {
  careFor,
  compactConfig,
  configPath,
  dataDir,
  dayKey,
  growthFor,
  loadConfig,
  moodFor,
  normalizeConfig,
  readJson,
  readJsonDetailed,
  statePath,
  topTool
} = require("./pet-lib");

function bytesLabel(bytes) {
  if (!Number.isFinite(bytes)) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function stateSize() {
  try {
    return fs.statSync(statePath()).size;
  } catch {
    return 0;
  }
}

function latestSession(state) {
  const key = state.latest_session_id;
  if (key && state.sessions?.[key]) return [key, state.sessions[key]];
  const entry = Object.entries(state.sessions || {}).sort((a, b) => (b[1].updated_at || 0) - (a[1].updated_at || 0))[0];
  return entry || ["default", {}];
}

function main() {
  const config = loadConfig();
  const configCheck = readJsonDetailed(configPath());
  const stateCheck = readJsonDetailed(statePath());
  const rawConfig = configCheck.ok ? configCheck.value : {};
  const normalized = normalizeConfig(rawConfig);
  const compactNormalized = compactConfig(normalized);
  const state = stateCheck.ok ? stateCheck.value : { sessions: {}, daily: {} };
  const [key, session] = latestSession(state);
  const care = careFor({ ...session, care: session.care || state.pet?.care });
  const growth = growthFor(state.pet || session);
  const stats = session.stats || {};
  const today = state.daily?.[dayKey()] || {};
  const tool = topTool(stats.tool_counts || today.tool_counts || {});
  const events = Array.isArray(session.events) ? session.events.slice(-3) : [];
  const isZh = config.language === "zh";

  console.log(isZh ? "宠物健康面板" : "Pet Health");
  console.log(`${isZh ? "数据目录" : "Data dir"}: ${dataDir()}`);
  if (!configCheck.ok && configCheck.exists) {
    console.log(`${isZh ? "配置" : "Config"}: invalid JSON (${configCheck.error})`);
  } else {
    console.log(`${isZh ? "配置" : "Config"}: ${JSON.stringify(rawConfig) === JSON.stringify(compactNormalized) ? "ok" : "needs normalize"}`);
  }
  if (!stateCheck.ok && stateCheck.exists) {
    console.log(`${isZh ? "状态解析" : "State parse"}: invalid JSON (${stateCheck.error})`);
  }
  console.log(`${isZh ? "状态文件" : "State file"}: ${bytesLabel(stateSize())}`);
  console.log(`${isZh ? "会话" : "Session"}: ${key}`);
  console.log(`${isZh ? "当前" : "Now"}: ${session.label || session.state || "idle"} · ${isZh ? "心情" : "mood"} ${moodFor(session) || "-"}`);
  console.log(`${isZh ? "能量" : "Energy"}: ${care.energy}/100 · ${isZh ? "亲密度" : "Bond"}: ${care.affection}/100`);
  console.log(`${isZh ? "成长" : "Growth"}: Lv.${growth.level} · ${growth.xp} XP · ${(growth.unlocks || []).join(", ") || "-"}`);
  console.log(`${isZh ? "统计" : "Stats"}: ${stats.tools || 0} ${isZh ? "步" : "moves"} · ${stats.edits || 0} ${isZh ? "编辑" : "edits"} · ${stats.failures || 0} ${isZh ? "失败" : "fails"} · ${isZh ? "连胜" : "streak"} ${stats.success_streak || 0}`);
  console.log(`${isZh ? "今日" : "Today"}: ${today.tools || 0} ${isZh ? "步" : "moves"} · ${today.recoveries || 0} ${isZh ? "次恢复" : "recoveries"} · ${isZh ? "最佳连胜" : "best streak"} ${today.best_streak || 0}`);
  console.log(`${isZh ? "常用工具" : "Top tool"}: ${tool ? `${tool.name} (${tool.count})` : "-"}`);
  if (events.length) {
    console.log(isZh ? "最近事件:" : "Recent events:");
    for (const event of events) console.log(`- ${isZh ? event.zh || event.en : event.en || event.zh}`);
  }
}

main();
