# Claude Status Pet

一个给 Claude Code CLI 用的状态栏宠物。它会监听 Claude Code 的 hooks
事件，把当前会话状态写入本地状态文件，再通过 Claude Code 的 `statusLine`
接口渲染成底部一行小宠物。

## 效果示例

```text
[>_>] editing · Write · Sonnet · my-repo · git:main · 42s · $0.03
[^_^] done · Opus · my-repo · $0.04
[o_o] idle · Haiku · docs
```

## 它做了什么

- 在 Claude Code 底部状态栏显示一个小宠物。
- 根据 Claude Code 事件切换状态：等待、倾听、思考、调用工具、完成、失败。
- 显示模型、当前目录、Git 分支、耗时、费用、工具名。
- 支持作为普通本地配置使用，也带有 Claude Code plugin 结构，方便后续发布。

## 项目结构

```text
claude-status-pet/
├── .claude-plugin/
│   └── plugin.json              # Claude Code 插件声明
├── hooks/
│   └── hooks.json               # 插件模式下的 hooks 配置
├── scripts/
│   ├── install.js               # 本机安装脚本
│   ├── install-all.js           # 总安装脚本
│   ├── uninstall.js             # 卸载脚本
│   ├── pet.js                   # 统一 CLI 入口
│   ├── pet-switch.js            # 宠物切换脚本
│   ├── pet-preview.js           # 宠物帧预览
│   ├── pet-play.js              # 宠物互动
│   ├── pet-config.js            # 配置读写
│   ├── pet-preset.js            # 预设外观
│   ├── pet-report.js            # 今日/本周陪伴报告
│   ├── pet-achievements.js      # 成就摘要
│   ├── pet-demo.js              # 状态栏演示
│   ├── pet-pack.js              # 导出宠物 JSON
│   ├── pet-import.js            # 导入宠物 JSON
│   ├── pet-setup.js             # 快速套用启动配置
│   ├── pet-validate.js          # 宠物 JSON 校验
│   ├── pet-create.js            # 宠物模板创建
│   ├── doctor.js                # 安装诊断
│   ├── pet-hook.js              # hooks 事件记录器
│   ├── pet-lib.js               # 公共工具函数
│   ├── pet-statusline.js        # statusLine 渲染脚本
│   └── test.js                  # 本地自动测试
├── pets/
│   ├── byte.json                # ASCII 默认宠物
│   ├── orbit.json               # Unicode 圆点宠物
│   ├── spark.json               # 活泼火花宠物
│   └── mono.json                # 纯 ASCII 兼容宠物
├── skills/
│   └── pet-control/
│       └── SKILL.md             # Claude Code skill
├── commands/
│   └── pet.md                   # Claude Code 命令说明
├── package.json
└── README.md
```

## 安装

推荐使用总安装脚本，在项目目录运行：

```bash
cd /path/to/claude-status-pet
node ./scripts/install-all.js --pet byte
```

然后重启 Claude Code。

总安装脚本会写入：

- `~/.claude/status-pet/`：宠物脚本、宠物配置、状态文件。
- `~/.claude/settings.json`：Claude Code 的 `statusLine` 和 hooks 配置。
- `~/.claude/skills/pet-control/`：让 Claude 可以通过 skill 理解宠物操作。
- `~/.claude/commands/pet.md`：命令说明。

安装脚本会在修改前自动备份原来的 `settings.json`，备份文件形如：

```text
~/.claude/settings.json.status-pet-backup-...
```

如果只想预览会写入什么：

```bash
node ./scripts/install-all.js --dry-run --pet byte
```

如果只想安装状态栏和 hooks，不同步 skill/command：

```bash
node ./scripts/install.js --pet byte
```

## 切换宠物

内置四套宠物：

- `byte`：默认，ASCII 风格，兼容性最好。
- `orbit`：简洁 Unicode 圆点风格。
- `spark`：亮一点的 ASCII 火花风格。
- `mono`：纯 ASCII、低装饰、最大兼容。

切换命令：

```bash
node ~/.claude/status-pet/scripts/pet-switch.js byte
node ~/.claude/status-pet/scripts/pet-switch.js orbit
node ~/.claude/status-pet/scripts/pet-switch.js spark
node ~/.claude/status-pet/scripts/pet-switch.js mono
```

也可以使用统一入口：

```bash
node ~/.claude/status-pet/scripts/pet.js switch orbit
node ~/.claude/status-pet/scripts/pet.js list
```

查看当前安装目录里的可用宠物：

```bash
node ~/.claude/status-pet/scripts/pet-switch.js --list
```

切换后如果状态栏没有立刻更新，重启 Claude Code。

## 配置

配置文件在：

```text
~/.claude/status-pet/config.json
```

示例：

```json
{
  "pet": "byte",
  "language": "en",
  "displayMode": "balanced",
  "palette": "classic",
  "style": "plain",
  "separator": " · ",
  "cwdSegments": 1,
  "contextBarWidth": 8,
  "flairChance": 0.04,
  "careHintChance": 0.02,
  "refreshInterval": 0,
  "customText": "",
  "companionPet": "",
  "quietHours": [],
  "colors": true,
  "maxWidth": 120,
  "show": {
    "label": true,
    "mood": true,
    "model": true,
    "cwd": true,
    "git": true,
    "gitChanges": true,
    "context": true,
    "tasks": true,
    "version": false,
    "petName": false,
    "petVitals": true,
    "cost": true,
    "elapsed": true,
    "tool": true,
    "stats": true,
    "flair": true
  }
}
```

字段说明：

- `pet`：当前宠物名，可选 `byte`、`orbit`、`spark`、`mono`。
- `language`：显示语言，可选 `en`、`zh`。
- `displayMode`：显示密度，可选 `quiet`、`compact`、`balanced`、`full`。
- `palette`：配色方案，可选 `mono`、`classic`、`soft`、`terminal`、`alert`。
- `style`：分隔符风格，可选 `plain` 或 `powerline`。
- `separator`：`plain` 风格下的分隔符。
- `cwdSegments`：显示路径末尾几段。
- `contextBarWidth`：context 进度条宽度。
- `flairChance`：个性短句出现概率，`0` 表示关闭。
- `careHintChance`：低概率照护提醒出现概率，`0` 表示关闭。
- `refreshInterval`：写入 Claude Code `statusLine.refreshInterval`；`0` 表示只随事件刷新。
- `customText`：固定显示的短文本，例如项目代号或环境名。
- `companionPet`：第二只陪伴宠物名，例如 `mono`；空字符串表示关闭。
- `quietHours`：安静时段数组，例如 `[{"start":"22:30","end":"08:00"}]`；时段内会减少短句提醒。
- `petName`：给状态栏里的宠物起一个显示名。
- `colors`：是否启用 ANSI 颜色。
- `maxWidth`：状态栏最大宽度。
- `show.label`：显示状态文字。
- `show.mood`：显示轻量心情，如 `focused`、`busy`、`confident`。
- `show.model`：显示模型名。
- `show.cwd`：显示当前目录名。
- `show.git`：显示 Git 分支。
- `show.gitChanges`：显示 Git 暂存、未暂存、未跟踪文件计数。
- `show.context`：显示 Claude Code 传入的 context 使用进度条。
- `show.tasks`：显示 Claude Code 传入的 subagent/tasks 摘要。
- `show.version`：显示 Claude Code 版本字段。
- `show.petName`：显示宠物名，默认关闭。
- `show.petVitals`：显示宠物能量和亲密度。
- `show.cost`：显示费用。
- `show.elapsed`：显示累计耗时。
- `show.tool`：显示最近工具名。
- `show.stats`：显示会话统计，如工具调用数、编辑数、连续成功。
- `show.flair`：显示宠物个性短句。

如果想禁用颜色，可以设置环境变量：

```bash
NO_COLOR=1 claude
```

## 命令入口

安装后可以使用统一入口：

```bash
node ~/.claude/status-pet/scripts/pet.js install --pet byte
node ~/.claude/status-pet/scripts/pet.js install-all --pet byte
node ~/.claude/status-pet/scripts/pet.js list
node ~/.claude/status-pet/scripts/pet.js switch orbit
node ~/.claude/status-pet/scripts/pet.js preview
node ~/.claude/status-pet/scripts/pet.js preview --animate --state editing byte
node ~/.claude/status-pet/scripts/pet.js preview --animate --action celebrate spark
node ~/.claude/status-pet/scripts/pet.js care
node ~/.claude/status-pet/scripts/pet.js feed
node ~/.claude/status-pet/scripts/pet.js play
node ~/.claude/status-pet/scripts/pet.js pet
node ~/.claude/status-pet/scripts/pet.js nap
node ~/.claude/status-pet/scripts/pet.js report
node ~/.claude/status-pet/scripts/pet.js report week
node ~/.claude/status-pet/scripts/pet.js achievements
node ~/.claude/status-pet/scripts/pet.js demo
node ~/.claude/status-pet/scripts/pet.js config get
node ~/.claude/status-pet/scripts/pet.js config set language zh
node ~/.claude/status-pet/scripts/pet.js preset cute-zh
node ~/.claude/status-pet/scripts/pet.js setup cute-zh
node ~/.claude/status-pet/scripts/pet.js pack spark ./spark.json
node ~/.claude/status-pet/scripts/pet.js import ./spark.json
node ~/.claude/status-pet/scripts/pet.js validate
node ~/.claude/status-pet/scripts/pet.js create mypet
node ~/.claude/status-pet/scripts/pet.js doctor
node ~/.claude/status-pet/scripts/pet.js uninstall --dry-run
```

常用独立脚本：

- `scripts/pet-switch.js`：列出或切换宠物。
- `scripts/pet-preview.js`：预览一个或全部宠物的状态帧。
- `scripts/pet-play.js`：喂食、玩耍、摸摸、休息和查看宠物状态。
- `scripts/pet-config.js`：读取或修改配置，支持 `show.petName` 这种点路径。
- `scripts/pet-preset.js`：应用预设配置。
- `scripts/pet-report.js`：查看今日或本周陪伴报告。
- `scripts/pet-achievements.js`：查看已解锁成就。
- `scripts/pet-demo.js`：生成一组模拟状态栏，用来挑风格。
- `scripts/pet-pack.js`：把某只宠物导出为可分享的 JSON。
- `scripts/pet-import.js`：导入别人分享的宠物 JSON。
- `scripts/pet-setup.js`：一键套用启动预设。
- `scripts/pet-validate.js`：校验宠物 JSON 是否完整。
- `scripts/pet-create.js`：创建一份新宠物模板。
- `scripts/doctor.js`：诊断安装目录、settings、hooks、状态文件和当前宠物。
- `scripts/uninstall.js`：清理配置并卸载。

## 美化能力

状态栏支持四种显示密度：

```text
quiet:    [o_o]
compact:  [o_o] editing · Write
balanced: [o_o] editing · focused · Write · Sonnet · repo · 3 moves
full:     [o_o] editing · focused · Write · Sonnet · repo · git:main · 42s · $0.01 · 3 moves
```

配色方案：

- `mono`：无彩色强调。
- `classic`：默认终端 cyan/yellow/red。
- `soft`：柔和低饱和。
- `terminal`：复古绿色终端感。
- `alert`：成功/错误更醒目。

内置预设：

```bash
node ~/.claude/status-pet/scripts/pet.js preset minimal
node ~/.claude/status-pet/scripts/pet.js preset cute-zh
node ~/.claude/status-pet/scripts/pet.js preset powerline-full
node ~/.claude/status-pet/scripts/pet.js preset quiet-work
```

- `minimal`：极简、无彩色、只保留宠物。
- `cute-zh`：中文、spark、soft 配色、轻量短句。
- `powerline-full`：完整信息、powerline 分隔符、context/git/tasks。
- `quiet-work`：紧凑工作模式，关闭短句和统计。

每个宠物可以在 JSON 里定义 `personality`，状态栏会低概率显示短句。
例如 `byte` 在编辑时可能出现 `steady hands`，`orbit` 在成功时可能出现
`settled`。想关闭短句，把 `flairChance` 设为 `0`。

## 更像小宠物的内容

这轮整合后，宠物不只是换帧，还会有一点"陪伴记忆"：

- 今日/本周报告：统计工具调用、编辑、搜索、失败、休息和互动。
- 成就系统：根据使用行为解锁 `first-snack`、`steady-streak`、`code-gardener` 等成就。
- 工作感知：Bash 命令会进一步识别成测试、安装依赖、Git 操作或 review。
- 照护提醒：`careHintChance` 控制低概率提醒，比如能量低时提示休息或投喂。
- 低能量降噪：能量很低时会自动减少个性短句，让状态栏更安静。
- 安静时段：`quietHours` 内会隐藏短句和照护提醒。
- 双宠物陪伴：`companionPet` 可以在主宠物旁边放第二只小伙伴。
- 动作预览：`preview --action celebrate` 可快速查看庆祝、睡觉、等待等动作别名。
- 分享导入：`pack` 导出宠物 JSON，`import` 导入别人做好的宠物。
- 快速演示：`demo` 打印多种模拟状态栏，方便挑显示密度和主题。

常用命令：

```bash
node ~/.claude/status-pet/scripts/pet.js report
node ~/.claude/status-pet/scripts/pet.js report week
node ~/.claude/status-pet/scripts/pet.js achievements
node ~/.claude/status-pet/scripts/pet.js demo
node ~/.claude/status-pet/scripts/pet.js preview --animate --action celebrate spark
node ~/.claude/status-pet/scripts/pet.js config set companionPet mono
node ~/.claude/status-pet/scripts/pet.js config set careHintChance 0.05
node ~/.claude/status-pet/scripts/pet.js config set quietHours '[{"start":"22:30","end":"08:00"}]'
```

## 中文显示

默认语言是英文。想切换中文，在 `~/.claude/status-pet/config.json` 里设置：

```json
{
  "language": "zh"
}
```

中文模式会切换状态标签、心情、统计单位、context/task 文案、能量/亲密度
标记，以及宠物个性短句。例如：

```text
*_* 写东西 · 专注 · Write · Sonnet · .../demo · [██░░░░░░] 25% 上下文 · 1 任务 · 能▰▰▰▰▱ 亲▰▰▰▱▱
```

想切回英文：

```json
{
  "language": "en"
}
```

也可以用命令切换：

```bash
node ~/.claude/status-pet/scripts/pet.js config set language zh
node ~/.claude/status-pet/scripts/pet.js config set language en
```

## 宠物互动

状态栏宠物会记录轻量的能量和亲密度：

```text
E▰▰▰▱▱ B▰▰▰▰▱
```

工具调用会消耗一点能量，成功会增加一点亲密度，失败会让宠物疲惫。
也可以手动互动：

```bash
node ~/.claude/status-pet/scripts/pet.js care
node ~/.claude/status-pet/scripts/pet.js feed
node ~/.claude/status-pet/scripts/pet.js play
node ~/.claude/status-pet/scripts/pet.js pet
node ~/.claude/status-pet/scripts/pet.js nap
```

如果想给宠物起名：

```json
{
  "petName": "Bytey",
  "show": {
    "petName": true
  }
}
```

或使用命令：

```bash
node ~/.claude/status-pet/scripts/pet.js config set petName Bytey
node ~/.claude/status-pet/scripts/pet.js config set show.petName true
```

从一些 Claude Code statusline 项目里吸收来的增强包括：

- 类 powerline 分隔符：`"style": "powerline"`。
- context 进度条：读取 Claude Code 传入的 `context_window.used_percentage`。
- git dirty 计数：显示暂存、未暂存、未跟踪文件数量。
- 路径段数控制：`cwdSegments` 可以显示 `.../parent/repo`。
- tasks 摘要：读取 Claude Code 传入的 `tasks` 数组。

## Skill 集成方式

项目内置 Claude Code skill：

```text
skills/pet-control/SKILL.md
```

当用户说"切换宠物""喂一下宠物""改成中文""诊断状态栏"等自然语言请求时，
skill 应优先调用已安装目录里的统一入口：

```bash
node ~/.claude/status-pet/scripts/pet.js <command>
```

常见意图映射：

| 用户意图 | skill 应执行 |
|---|---|
| 查看可用宠物 | `pet.js list` |
| 切换到 spark | `pet.js switch spark` |
| 查看宠物状态 | `pet.js care` |
| 喂食 | `pet.js feed` |
| 玩耍 | `pet.js play` |
| 摸摸 | `pet.js pet` |
| 休息 | `pet.js nap` |
| 切换中文 | `pet.js config set language zh` |
| 切换英文 | `pet.js config set language en` |
| 显示完整状态栏 | `pet.js config set displayMode full` |
| 隐藏宠物名 | `pet.js config set show.petName false` |
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
| 导出宠物 | `pet.js pack spark ./spark.json` |
| 导入宠物 | `pet.js import ./spark.json` |

如果 `~/.claude/status-pet/scripts/pet.js` 不存在，说明还没有安装或安装目录
不是默认路径。先在项目目录运行：

```bash
node ./scripts/install-all.js --pet byte
```

本项目也保留 Claude Code plugin 结构：

```text
.claude-plugin/plugin.json
hooks/hooks.json
commands/pet.md
skills/pet-control/SKILL.md
```

需要注意：Claude Code 的 `statusLine` 仍是用户设置项，所以即使作为 plugin
使用，也建议运行总安装脚本，让 `~/.claude/settings.json` 写入 statusLine 和
hooks，并同步全局 skill/command。

## 稳定性和安全边界

当前脚本做了几层保护：

- 宠物文件名只允许小写字母、数字、下划线和短横线，避免通过 `../` 读写宠物目录外的文件。
- `config set` 会拒绝 `__proto__`、`prototype`、`constructor` 这类危险键，避免配置污染。
- 配置会被标准化：语言、显示模式、主题、数值范围和文本长度都会回到安全范围内。
- 导入宠物前会校验 JSON，状态帧数量和单帧长度有限制，避免状态栏被异常文件撑爆。
- 状态文件会自动修剪，只保留最近会话和最近 30 天日报，避免长期使用后无限增长。
- 本周报告会按日期排序后统计最近 7 天，不依赖 JSON 写入顺序。

## 状态映射

| Claude Code 事件 | 宠物状态 |
|---|---|
| `SessionStart` | waking / listening |
| `UserPromptSubmit` | listening |
| `PreToolUse` Bash | running shell |
| `PreToolUse` Bash 测试命令 | testing |
| `PreToolUse` Bash 安装命令 | installing |
| `PreToolUse` Bash Git 命令 | git |
| `PreToolUse` Bash diff/log/status | reviewing |
| `PreToolUse` Write/Edit | editing |
| `PreToolUse` Read/Grep/Glob | searching |
| `PreToolUse` Web | browsing |
| `PreToolUse` Task | delegating |
| `PreToolUse` 其他工具 | using tool |
| `PostToolUse` 成功 | tool done |
| `PostToolUse` 失败 | tool failed |
| `Notification` | waiting |
| `Stop` | done |
| `SubagentStop` | agent done |
| `PreCompact` | compacting |
| `SessionEnd` | sleeping |

## 本地测试

运行自动测试：

```bash
npm test
```

模拟一次工具调用状态：

```bash
CLAUDE_STATUS_PET_DIR=/tmp/claude-status-pet-test \
node scripts/pet-hook.js <<'JSON'
{
  "hook_event_name": "PreToolUse",
  "session_id": "demo",
  "tool_name": "Write",
  "cwd": "/tmp/demo"
}
JSON

CLAUDE_STATUS_PET_DIR=/tmp/claude-status-pet-test \
node scripts/pet-statusline.js <<'JSON'
{
  "hook_event_name": "Status",
  "session_id": "demo",
  "model": { "display_name": "Sonnet" },
  "workspace": { "current_dir": "/tmp/demo" },
  "cost": {
    "total_cost_usd": 0.0123,
    "total_duration_ms": 42000
  }
}
JSON
```

预期输出类似：

```text
[>_>] editing · Write · Sonnet · demo · 42s · $0.01
```

## 卸载

推荐使用卸载脚本：

```bash
node ~/.claude/status-pet/scripts/uninstall.js
```

卸载脚本会备份 `~/.claude/settings.json`，移除本项目写入的 `statusLine`
和 hooks，并删除 `~/.claude/status-pet`。

如果只想预览会发生什么：

```bash
node ~/.claude/status-pet/scripts/uninstall.js --dry-run
```

如果想同时清理 `install-all` 同步的 skill 和 command：

```bash
node ~/.claude/status-pet/scripts/uninstall.js --all
```

如果想保留安装目录，只清理 Claude Code 配置：

```bash
node ~/.claude/status-pet/scripts/uninstall.js --keep-files
```

## 常见问题

### 状态栏没有显示

确认：

- 已经重启 Claude Code。
- `~/.claude/settings.json` 里存在 `statusLine`。
- `~/.claude/status-pet/scripts/pet-statusline.js` 存在。
- 脚本有可执行权限。

也可以运行诊断：

```bash
node ~/.claude/status-pet/scripts/doctor.js
```

### 宠物一直是 idle

通常是 hooks 没有触发。确认 `~/.claude/settings.json` 里 hooks 指向：

```text
~/.claude/status-pet/scripts/pet-hook.js
```

也可以用 Claude Code 的 `/hooks` 查看 hooks 是否注册。

### emoji 宽度不对

切回 ASCII 宠物：

```bash
node ~/.claude/status-pet/scripts/pet-switch.js byte
```

## English Summary

Claude Status Pet is a small Claude Code status-line companion. It records hook
events into a local state file and renders a one-line pet through Claude Code's
`statusLine` command. Run `node ./scripts/install.js --pet byte`, restart Claude
Code, and the pet will appear in the bottom status line. Use
`node ~/.claude/status-pet/scripts/pet.js switch orbit` to switch pets,
`node ~/.claude/status-pet/scripts/pet.js preview --animate byte` to inspect
frames, `node ~/.claude/status-pet/scripts/pet.js care` for energy and bond,
`node ~/.claude/status-pet/scripts/pet.js report week` for companion reports,
`node ~/.claude/status-pet/scripts/pet.js achievements` for unlocks,
`node ~/.claude/status-pet/scripts/pet.js pack spark ./spark.json` to share a
pet, `node ~/.claude/status-pet/scripts/pet.js validate` before adding new pets,
and `node ~/.claude/status-pet/scripts/pet.js uninstall` to uninstall.
