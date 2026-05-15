#!/usr/bin/env node

const { achievementsFor, loadConfig, readJson, statePath } = require("./pet-lib");

const NAMES = {
  "first-snack": ["First snack", "首次投喂"],
  "play-break": ["Play break", "玩耍时间"],
  "steady-streak": ["Steady output", "稳定输出"],
  "clue-hunter": ["Clue hunter", "线索猎手"],
  "code-gardener": ["Code gardener", "代码园丁"],
  "terminal-runner": ["Terminal runner", "终端跑者"],
  "full-energy": ["Full energy", "能量满格"],
  "full-bond": ["Full bond", "亲密满格"],
  "chinese-mode": ["Chinese mode", "中文模式"],
  powerline: ["Powerline", "能量线"]
};

function main() {
  const config = loadConfig();
  const state = readJson(statePath(), { sessions: {} });
  const status = state.sessions?.[state.latest_session_id] || state.sessions?.default || {};
  const achievements = achievementsFor(status, config);
  const isZh = config.language === "zh";
  console.log(isZh ? "宠物成就" : "Pet Achievements");
  if (!achievements.length) { console.log(isZh ? "还没有解锁，继续一起工作吧。" : "No achievements yet. Keep going."); return; }
  for (const id of achievements) console.log(`- ${(NAMES[id] || [id, id])[isZh ? 1 : 0]}`);
}

main();
