---
name: pet-control
description: Use this when the user wants to configure, switch, debug, or customize the Claude Code status-line pet.
---

# Pet Control

This plugin adds a small status-line pet for Claude Code. It is driven by hooks
that write session state and a statusLine script that renders the first line of
output. Use this skill to operate the installed pet from natural language.

Useful files:

- `scripts/pet-hook.js`: records hook events into the pet state file.
- `scripts/pet-statusline.js`: renders the status line from Claude Code stdin.
- `scripts/install-all.js`: installs runtime, hooks, skill, and command in one step.
- `scripts/pet.js`: unified CLI for install-all, install, list, switch, preview,
  validate, create, doctor, config, care, report, achievements, demo, pack,
  import, setup, and uninstall.

## Integration Contract

Prefer the installed unified CLI:

```bash
node ~/.claude/status-pet/scripts/pet.js <command>
```

If that file is missing, the pet is probably not installed or is installed in a
custom directory. In that case, use the project-local script only for install or
diagnosis, and tell the user the installed copy must be refreshed:

```bash
node ./scripts/install-all.js --pet byte
```

Avoid manually editing JSON when a CLI command exists. Use
`pet.js config set <key> <value>` for config changes.

## Intent Mapping

Bundled pets are `byte`, `orbit`, `spark`, and `mono`.

Use these mappings when the user asks in natural language. Treat this table as
the canonical skill behavior for pet operations.

The installed command prefix is:

```bash
node ~/.claude/status-pet/scripts/pet.js
```

When executing a mapped command, prepend that prefix. For example,
`pet.js feed` means:

```bash
node ~/.claude/status-pet/scripts/pet.js feed
```

### Core Pet Operations

| 用户意图 | skill 应执行 |
|---|---|
| 查看可用宠物 | `pet.js list` |
| 切换到 byte | `pet.js switch byte` |
| 切换到 orbit | `pet.js switch orbit` |
| 切换到 spark | `pet.js switch spark` |
| 切换到 mono | `pet.js switch mono` |
| 查看宠物状态 | `pet.js care` |
| 喂食 | `pet.js feed` |
| 玩耍 | `pet.js play` |
| 摸摸 | `pet.js pet` |
| 休息 | `pet.js nap` |
| 切换中文 | `pet.js config set language zh` |
| 切换英文 | `pet.js config set language en` |
| 显示完整状态栏 | `pet.js config set displayMode full` |
| 显示平衡状态栏 | `pet.js config set displayMode balanced` |
| 显示紧凑状态栏 | `pet.js config set displayMode compact` |
| 只显示宠物 | `pet.js config set displayMode quiet` |
| 隐藏宠物名 | `pet.js config set show.petName false` |
| 显示宠物名 | `pet.js config set show.petName true` |
| 诊断安装 | `pet.js doctor` |
| 预览动画 | `pet.js preview --animate --state editing spark` |
| 校验宠物文件 | `pet.js validate` |
| 查看今日报告 | `pet.js report` |
| 查看本周报告 | `pet.js report week` |
| 查看成就 | `pet.js achievements` |
| 演示状态栏 | `pet.js demo` |
| 快速设置中文可爱版 | `pet.js setup cute-zh` |
| 启用双宠物 | `pet.js config set companionPet mono` |
| 关闭双宠物 | `pet.js config set companionPet ""` |
| 调高照护提醒 | `pet.js config set careHintChance 0.05` |
| 关闭照护提醒 | `pet.js config set careHintChance 0` |
| 导出宠物 | `pet.js pack <pet> <file.json>` |
| 导入宠物 | `pet.js import <file.json>` |

## Execution Rules

1. Before executing a mapped operation, prefer the installed CLI at
   `~/.claude/status-pet/scripts/pet.js`.
2. If the installed CLI is missing, tell the user to run
   `node ./scripts/install-all.js --pet byte` from the project directory.
3. Use CLI commands instead of manually editing `config.json` whenever possible.
4. After config, switch, install, or uninstall operations, mention that Claude
   Code may need to restart if the status line does not update immediately.

## Styling

The installed `config.json` supports:

- `language`: `en` or `zh` for English/Chinese status text.
- `displayMode`: `quiet`, `compact`, `balanced`, or `full`.
- `palette`: `mono`, `classic`, `soft`, `terminal`, or `alert`.
- `style`: `plain` or `powerline`.
- `separator`, `cwdSegments`, `contextBarWidth`, `refreshInterval`, and
  `customText` for richer statusline formatting.
- `flairChance`: probability for short personality phrases; use `0` to turn them off.
- `careHintChance`: probability for care hints; use `0` to turn them off.
- `companionPet`: optional second pet name to render next to the main pet.
- `quietHours`: optional JSON array of `{ "start": "HH:MM", "end": "HH:MM" }`.
- `petName`: optional display name for the pet.

## Pet Care

Use `scripts/pet.js care` to show energy and bond, `scripts/pet.js feed` to
restore energy, `scripts/pet.js play` to increase bond, `scripts/pet.js pet` for
a small affection boost, and `scripts/pet.js nap` to rest the pet.

## Pet Memory and Sharing

Use `scripts/pet.js report` for today's activity, `scripts/pet.js report week`
for the last seven days, and `scripts/pet.js achievements` for unlocked
achievements. Use `scripts/pet.js demo` when the user wants to see what the
status line can look like without waiting for live events. Use
`scripts/pet.js pack <pet> <file.json>` to export a pet and
`scripts/pet.js import <file.json>` to import a shared pet file.
