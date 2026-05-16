#!/usr/bin/env node

const { bar, GROWTH_LEVELS, growthFor, loadConfig, readJson, statePath } = require("./pet-lib");

function nextLevel(growth) {
  return GROWTH_LEVELS.find((item) => item.xp > growth.xp) || null;
}

function main() {
  const config = loadConfig();
  const state = readJson(statePath(), { pet: {} });
  const growth = growthFor(state.pet || {});
  const next = nextLevel(growth);
  const isZh = config.language === "zh";
  const levelInfo = GROWTH_LEVELS.find((item) => item.level === growth.level) || GROWTH_LEVELS[0];
  const name = isZh ? levelInfo.zh : levelInfo.en;

  console.log(isZh ? "宠物成长" : "Pet Growth");
  console.log(`${isZh ? "等级" : "Level"}: Lv.${growth.level} ${name}`);
  if (next) {
    const prev = [...GROWTH_LEVELS].reverse().find((item) => item.xp <= growth.xp) || GROWTH_LEVELS[0];
    const span = Math.max(1, next.xp - prev.xp);
    const progress = Math.round(((growth.xp - prev.xp) / span) * 100);
    console.log(`${isZh ? "经验" : "XP"}: ${growth.xp}/${next.xp} ${bar(progress, 10)}`);
  } else {
    console.log(`${isZh ? "经验" : "XP"}: ${growth.xp} ${isZh ? "满级" : "max level"}`);
  }
  console.log(`${isZh ? "解锁" : "Unlocks"}: ${(growth.unlocks || []).join(", ") || "-"}`);
  if (Array.isArray(growth.log) && growth.log.length) {
    console.log(isZh ? "最近成长:" : "Recent growth:");
    for (const item of growth.log.slice(-5)) {
      console.log(`- +${item.xp} XP · ${item.reason} · Lv.${item.level}`);
    }
  }
}

main();
