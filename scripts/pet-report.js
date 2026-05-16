#!/usr/bin/env node

const { dayKey, loadConfig, readJson, statePath, topTool } = require("./pet-lib");

function topMood(moods = {}) {
  const entries = Object.entries(moods).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return entries[0] ? entries[0][0] : "";
}

function main() {
  const config = loadConfig();
  const state = readJson(statePath(), { daily: {} });
  const key = process.argv[2] === "week" ? "week" : dayKey();
  const isZh = config.language === "zh";

  if (key === "week") {
    const days = Object.entries(state.daily || {})
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([, item]) => item);
    const sum = days.reduce((acc, item) => {
      for (const field of ["tools", "edits", "searches", "shells", "tests", "installs", "git", "failures", "successes"]) {
        acc[field] = (acc[field] || 0) + (item[field] || 0);
      }
      acc.recoveries = (acc.recoveries || 0) + (item.recoveries || 0);
      acc.best_streak = Math.max(acc.best_streak || 0, item.best_streak || 0);
      for (const [tool, count] of Object.entries(item.tool_counts || {})) {
        acc.tool_counts = acc.tool_counts || {};
        acc.tool_counts[tool] = (acc.tool_counts[tool] || 0) + count;
      }
      return acc;
    }, {});
    const tool = topTool(sum.tool_counts || {});
    console.log(isZh ? "本周陪伴报告" : "Weekly Companion Report");
    console.log(`${sum.tools || 0} ${isZh ? "步" : "moves"} · ${sum.edits || 0} ${isZh ? "编辑" : "edits"} · ${sum.searches || 0} ${isZh ? "搜索" : "searches"} · ${sum.tests || 0} ${isZh ? "测试" : "tests"} · ${sum.installs || 0} ${isZh ? "安装" : "installs"} · ${sum.failures || 0} ${isZh ? "失败" : "fails"}`);
    console.log(`${isZh ? "恢复" : "Recoveries"} ${sum.recoveries || 0} · ${isZh ? "最佳连胜" : "Best streak"} ${sum.best_streak || 0} · ${isZh ? "常用工具" : "Top tool"} ${tool ? `${tool.name} (${tool.count})` : "-"}`);
    return;
  }

  const item = state.daily?.[key] || {};
  const tool = topTool(item.tool_counts || {});
  const mood = topMood(item.moods || {});
  console.log(isZh ? "今日陪伴报告" : "Today Companion Report");
  console.log(`${item.tools || 0} ${isZh ? "步" : "moves"} · ${item.edits || 0} ${isZh ? "编辑" : "edits"} · ${item.searches || 0} ${isZh ? "搜索" : "searches"} · ${item.tests || 0} ${isZh ? "测试" : "tests"} · ${item.installs || 0} ${isZh ? "安装" : "installs"} · ${item.failures || 0} ${isZh ? "失败" : "fails"}`);
  console.log(`${isZh ? "恢复" : "Recoveries"} ${item.recoveries || 0} · ${isZh ? "最佳连胜" : "Best streak"} ${item.best_streak || 0} · ${isZh ? "常用工具" : "Top tool"} ${tool ? `${tool.name} (${tool.count})` : "-"} · ${isZh ? "主心情" : "Mood"} ${mood || "-"}`);
  if (Array.isArray(item.events) && item.events.length) {
    console.log(isZh ? "今日小事件" : "Today events");
    for (const event of item.events.slice(-3)) console.log(`- ${isZh ? event.zh || event.en : event.en || event.zh}`);
  }
}

main();
