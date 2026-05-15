#!/usr/bin/env node

const {
  ensureDir, nowMs, readJson, readStdinJson, pruneState, sessionKey, statePath,
  statusFromHook, accumulateDaily, updateCare, updateStats, writeJsonAtomic
} = require("./pet-lib");

function main() {
  const input = readStdinJson();
  const key = sessionKey(input);
  const current = readJson(statePath(), { sessions: {} });
  const status = statusFromHook(input);
  const previous = current.sessions?.[key] || {};
  const updatedAt = nowMs();

  ensureDir(require("path").dirname(statePath()));
  current.sessions = current.sessions || {};
  current.sessions[key] = {
    ...previous,
    ...status,
    stats: updateStats(previous, input, status, updatedAt),
    care: updateCare(previous, input, status, updatedAt),
    session_id: key,
    event: input.hook_event_name || "Unknown",
    cwd: input.cwd || previous.cwd || "",
    transcript_path: input.transcript_path || previous.transcript_path || "",
    updated_at: updatedAt
  };
  current.daily = accumulateDaily(current.daily, input, status, updatedAt);
  current.latest_session_id = key;
  current.updated_at = updatedAt;

  writeJsonAtomic(statePath(), pruneState(current, updatedAt));
}

main();
