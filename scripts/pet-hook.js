#!/usr/bin/env node

const {
  ensureDir,
  loadConfig,
  nowMs,
  readJson,
  readStdinJson,
  pruneState,
  randomEventFor,
  sessionKey,
  statePath,
  statusFromHook,
  accumulateDaily,
  applyGrowth,
  updateCare,
  updateStats,
  growthXpForEvent,
  writeJsonAtomic
} = require("./pet-lib");

function main() {
  const input = readStdinJson();
  const key = sessionKey(input);
  const current = readJson(statePath(), { sessions: {} });
  const config = loadConfig();
  const status = statusFromHook(input);
  const profile = current.pet || {};
  const previous = current.sessions?.[key] || {
    care: profile.care,
    growth: profile.growth,
    events: profile.events,
    random_event: profile.random_event
  };
  const updatedAt = nowMs();
  const stats = updateStats(previous, input, status, updatedAt);
  const care = updateCare(previous, input, status, updatedAt);
  const growth = applyGrowth(profile, growthXpForEvent(input, status, previous), status.label || status.state, updatedAt);
  const randomEvent = randomEventFor(previous, status, config, updatedAt);
  const events = randomEvent ? [...(previous.events || []), randomEvent].slice(-10) : previous.events || [];

  ensureDir(require("path").dirname(statePath()));
  current.sessions = current.sessions || {};
  current.sessions[key] = {
    ...previous,
    ...status,
    stats,
    care,
    growth,
    events,
    random_event: randomEvent || previous.random_event || null,
    session_id: key,
    event: input.hook_event_name || "Unknown",
    cwd: input.cwd || previous.cwd || "",
    transcript_path: input.transcript_path || previous.transcript_path || "",
    updated_at: updatedAt
  };
  current.pet = {
    ...(current.pet || {}),
    care,
    growth,
    events,
    random_event: randomEvent || current.pet?.random_event || null,
    updated_at: updatedAt
  };
  current.daily = accumulateDaily(current.daily, input, status, updatedAt, previous, current.sessions[key], randomEvent);
  current.latest_session_id = key;
  current.updated_at = updatedAt;

  writeJsonAtomic(statePath(), pruneState(current, updatedAt));
}

main();
