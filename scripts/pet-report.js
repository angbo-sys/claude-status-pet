#!/usr/bin/env node

const { dayKey, loadConfig, readJson, statePath } = require("./pet-lib");

function main() {
  const config = loadConfig();
  const state = readJson(statePath(), { daily: {} });
  const key = process.argv[2] === "week" ? "week" : dayKey();
  const isZh = config.language === "zh";

  if (key === "week") {
    const days = Object.entries(state.daily || {}).sort(([a], [b]) => a.localeCompare(b)).slice(-7).map(([, item]) => item);
    const sum = days.reduce((acc, item) => {
      for (const field of ["tools", "edits", "searches", "shells", "tests", "installs", "git", "failures", "successes"]) acc[field] = (acc[field] || 0) + (item[field] || 0);
      return acc;
    }, {});
    console.log(isZh ? "本周陪伴报告" : "Weekly Companion Report");
    console.log(`${sum.tools || 0} ${isZh ? "步" : "moves"} · ${sum.edits || 0} ${isZh ? "编辑" : "edits"} · ${sum.searches || 0} ${isZh ? "搜索" : "searches"} · ${sum.tests || 0} ${isZh ? "测试" : "tests"} · ${sum.installs || 0} ${isZh ? "安装" : "installs"} · ${sum.failures || 0} ${isZh ? "失败" : "fails"}`);
    return;
  }

  const item = state.daily?.[key] || {};
  console.log(isZh ? "今日陪伴报告" : "Today Companion Report");
  console.log(`${item.tools || 0} ${isZh ? "步" : "moves"} · ${item.edits || 0} ${isZh ? "编辑" : "edits"} · ${item.searches || 0} ${isZh ? "搜索" : "searches"} · ${item.tests || 0} ${isZh ? "测试" : "tests"} · ${item.installs || 0} ${isZh ? "安装" : "installs"} · ${item.failures || 0} ${isZh ? "失败" : "fails"}`);
}

main();
