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
- `scripts/pet-switch.js`: lists and switches installed pets.
- `scripts/pet-preview.js`: previews pet frames by state.
- `scripts/pet-play.js`: handles pet care actions and status.
- `scripts/pet-config.js`: reads and writes config keys, including dotted keys.
- `scripts/pet-quick.js`: quickly configures pet, theme, language, layout, and visible fields.
- `scripts/pet-preset.js`: applies built-in configuration presets.
- `scripts/pet-theme.js`: applies visual theme packages.
- `scripts/pet-report.js`: shows today/week companion activity summaries.
- `scripts/pet-achievements.js`: shows derived pet achievements.
- `scripts/pet-health.js`: shows install, config, care, diary, and recent events.
- `scripts/pet-growth.js`: shows persistent level, XP, unlocks, and growth log.
- `scripts/pet-demo.js`: prints simulated status lines.
- `scripts/pet-pack.js`: exports a pet JSON for sharing.
- `scripts/pet-import.js`: imports a shared pet JSON.
- `scripts/pet-setup.js`: applies starter setup presets.
- `scripts/pet-validate.js`: validates pet JSON files.
- `scripts/pet-create.js`: creates a complete pet JSON template.
- `scripts/doctor.js`: diagnoses install status, hooks, config, and overrides.
- `scripts/uninstall.js`: removes status-pet settings and installed files.
- `pets/*.json`: named pet frame sets.

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

Bundled pets are `byte`, `orbit`, `spark`, `mono`, and `pico`.

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
| 切换到 pico | `pet.js switch pico` |
| 查看宠物状态 | `pet.js care` |
| 喂食 | `pet.js feed` |
| 玩耍 | `pet.js play` |
| 摸摸 | `pet.js pet` |
| 休息 | `pet.js nap` |
| 切换中文 | `pet.js config set language zh` |
| 切换英文 | `pet.js config set language en` |
| 快速可爱配置 | `pet.js quick cute` |
| 快速专注配置 | `pet.js quick focus` |
| 快速完整配置 | `pet.js quick full` |
| 快速干净配置 | `pet.js quick clean` |
| 显示完整状态栏 | `pet.js config set displayMode full` |
| 显示平衡状态栏 | `pet.js config set displayMode balanced` |
| 显示紧凑状态栏 | `pet.js config set displayMode compact` |
| 只显示宠物 | `pet.js config set displayMode quiet` |
| 显示多行面板 | `pet.js config set displayMode panel` |
| 隐藏宠物名 | `pet.js config set show.petName false` |
| 显示宠物名 | `pet.js config set show.petName true` |
| 诊断安装 | `pet.js doctor` |
| 预览动画 | `pet.js preview --animate --state editing spark` |
| 校验宠物文件 | `pet.js validate` |
| 查看今日报告 | `pet.js report` |
| 查看本周报告 | `pet.js report week` |
| 查看成就 | `pet.js achievements` |
| 查看健康面板 | `pet.js health` |
| 查看成长进度 | `pet.js growth` |
| 演示状态栏 | `pet.js demo` |
| 应用专注主题 | `pet.js theme focus` |
| 应用可爱主题 | `pet.js theme cute` |
| 应用密集主题 | `pet.js theme dense` |
| 应用夜间主题 | `pet.js theme night` |
| 快速设置中文可爱版 | `pet.js setup cute-zh` |
| 启用双宠物 | `pet.js config set companionPet mono` |
| 关闭双宠物 | `pet.js config set companionPet ""` |
| 调高照护提醒 | `pet.js config set careHintChance 0.05` |
| 关闭照护提醒 | `pet.js config set careHintChance 0` |
| 调整随机事件 | `pet.js config set randomEventChance 0.08` |
| 设置两行面板 | `pet.js config set panelRows 2` |
| 设置三行面板 | `pet.js config set panelRows 3` |
| 开启紧凑面板 | `pet.js config set panelCompact true` |
| 隐藏费用和耗时 | `pet.js quick --hide cost,elapsed` |
| 显示 Git 上下文任务 | `pet.js quick --show git,context,tasks` |
| 导出宠物 | `pet.js pack <pet> <file.json>` |
| 导入宠物 | `pet.js import <file.json>` |

### Extended Operations

| 用户意图 | skill 应执行 |
|---|---|
| 预览某个宠物 | `pet.js preview <byte|orbit|spark|mono|pico>` |
| 预览某个状态动画 | `pet.js preview --animate --state <state> <pet>` |
| 设置宠物名字 | `pet.js config set petName <name>` |
| 一条命令配置宠物和状态栏 | `pet.js quick --pet <pet> --lang <en|zh> --mode <mode> --rows <2|3> --show <fields> --hide <fields>` |
| 切换配色主题 | `pet.js config set palette <mono|classic|soft|terminal|alert>` |
| 应用预设 | `pet.js preset <minimal|cute-zh|powerline-full|panel-zh|quiet-work>` |
| 应用主题包 | `pet.js theme <focus|cute|dense|night|minimal>` |
| 设置 powerline 风格 | `pet.js config set style powerline` |
| 设置普通分隔符风格 | `pet.js config set style plain` |
| 查看配置 | `pet.js config get` |
| 查看某个配置 | `pet.js config get <key>` |
| 设置安静时段 | edit `quietHours` with `pet.js config set quietHours <json-array>` |
| 预览庆祝动作 | `pet.js preview --animate --action celebrate <pet>` |
| 预览睡觉动作 | `pet.js preview --animate --action sleep <pet>` |
| 创建宠物模板 | `pet.js create <name>` |
| 卸载预览 | `pet.js uninstall --dry-run` |
| 完整卸载 | `pet.js uninstall --all` |
| 卸载 | `pet.js uninstall` |

Supported preview states include `idle`, `listening`, `thinking`, `tool`,
`running`, `editing`, `searching`, `browsing`, `delegating`, `compacting`,
`success`, `error`, `waiting`, and `sleeping`.

Supported preview actions include `blink`, `listen`, `think`, `work`, `run`,
`code`, `search`, `browse`, `cheer`, `celebrate`, `shake`, `wait`, `sleep`, and
`nap`. Actions are aliases for states.

## Execution Rules

1. Before executing a mapped operation, prefer the installed CLI at
   `~/.claude/status-pet/scripts/pet.js`.
2. If the installed CLI is missing, tell the user to run
   `node ./scripts/install-all.js --pet byte` from the project directory, or run
   it yourself when the user asked for installation.
3. Use CLI commands instead of manually editing `config.json` whenever possible.
   Prefer `pet.js quick ...` for user-facing display/layout changes, then fall
   back to `pet.js config set ...` for advanced fields.
4. For ambiguous pet names, run `pet.js list` or ask which pet to use.
5. For ambiguous display mode, explain the choices: `quiet`, `compact`,
   `balanced`, `full`, `panel`.
6. For ambiguous palette, explain the choices: `mono`, `classic`, `soft`,
   `terminal`, `alert`.
7. For ambiguous preset, explain the choices: `minimal`, `cute-zh`,
   `powerline-full`, `panel-zh`, `quiet-work`.
8. After config, switch, install, or uninstall operations, mention that Claude
   Code may need to restart if the status line does not update immediately.

If a requested pet name is unclear or not in the bundled list, list pets and ask
which one to use. If `CLAUDE_STATUS_PET` is set, it overrides `config.json`;
mention this when a switch appears to have no effect.

## Debugging and Maintenance

Use `scripts/pet.js list` to list installed pets, `scripts/pet.js preview` to
inspect frames, `scripts/pet.js preview --animate --state editing byte` to see
an animated preview, and `scripts/pet.js doctor` to diagnose installation
issues. Use `scripts/pet.js validate` before accepting a new pet file. Use
`scripts/uninstall.js --dry-run` before uninstalling when the user wants to see
what will be removed.

Safety notes: pet file names must be lowercase letters, numbers, underscores, or
hyphens. Do not bypass `pet.js config set` for user-requested config edits; it
normalizes values and rejects unsafe config keys. Create/import refuses to
overwrite an existing pet unless the user explicitly asks for `--force`.
Validate imported pet JSON before switching to it.

## Styling

The installed `config.json` supports:

- `language`: `en` or `zh` for English/Chinese status text.
- `displayMode`: `quiet`, `compact`, `balanced`, `full`, or `panel`.
- `palette`: `mono`, `classic`, `soft`, `terminal`, or `alert`.
- `style`: `plain` or `powerline`.
- `separator`, `cwdSegments`, `contextBarWidth`, `refreshInterval`, and
  `customText` for richer statusline formatting.
- `flairChance`: probability for short personality phrases; use `0` to turn
  them off.
- `careHintChance`: probability for care hints; use `0` to turn them off.
- `randomEventChance`: probability for persisted random pet events; use `0` to
  turn them off.
- `companionPet`: optional second pet name to render next to the main pet.
- `quietHours`: optional JSON array of `{ "start": "HH:MM", "end": "HH:MM" }`
  ranges that suppress flair and care hints.
- `panelRows`: `2` or `3` lines for `displayMode: panel`.
- `panelCompact`: compact panel statistics when true.
- `petName`: optional display name for the pet; only shown when
  `show.petName` is true.
- `show.label`, `show.mood`, `show.stats`, `show.flair`, `show.petName`, and
  `show.petVitals` for controlling the richer status-line elements.

## Pet Care

Use `scripts/pet.js care` to show energy and bond, `scripts/pet.js feed` to
restore energy, `scripts/pet.js play` to increase bond, `scripts/pet.js pet` for
a small affection boost, and `scripts/pet.js nap` to rest the pet.
Care state is stored in a global pet profile as well as the latest session, so
energy, bond, snacks, play count, and naps persist when Claude starts a new
session.
Growth state is also global: level, XP, unlocks, and growth log must persist
across session switches and Claude restarts.

When the user asks for Chinese text, set `language` to `zh` in the installed
`config.json`. Switch back with `language: "en"`.

## Pet Memory and Sharing

Use `scripts/pet.js report` for today's activity, `scripts/pet.js report week`
for the last seven days, and `scripts/pet.js achievements` for unlocked
achievements. Use `scripts/pet.js growth` for level, XP, unlocks, and growth
log. Use `scripts/pet.js health` for install/config/care/diary/recent events in
one view. Use `scripts/pet.js demo` when the user wants to see what
the status line can look like without waiting for live events. Use
`scripts/pet.js pack <pet> <file.json>` to export a pet and
`scripts/pet.js import <file.json>` to import a shared pet file; validate after
importing.

## Response Guidance

After performing an operation, keep the response short and say what changed.
For config and switch operations, mention that Claude Code may need a restart if
the status line does not update immediately. For diagnosis, summarize the
important failing checks first.
