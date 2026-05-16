# Claude Status Pet

Claude Code 状态栏小宠物。它会根据 hooks 感知当前工作状态，在底部状态栏显示宠物、模型、目录、Git、上下文、能量、亲密度、成长等级等信息。

最推荐的使用方式是直接让 Claude 通过 Skill 帮你操作：

- "把宠物切换成 pico"
- "状态栏改成中文多行"
- "应用 cute 主题"
- "隐藏费用和耗时"
- "显示 Git、上下文和任务"
- "查看宠物健康和成长"

Skill 会自动执行对应的 `pet.js` 命令。需要手动时，再使用下面的命令。

## 快速安装

```bash
cd /Users/yelainab/project/claude-status-pet
node ./scripts/install-all.js --pet byte
```

然后重启 Claude Code。

安装内容：

- `~/.claude/status-pet/`：运行脚本、宠物、状态和配置。
- `~/.claude/settings.json`：statusLine 和 hooks。
- `~/.claude/skills/pet-control/`：自然语言操作 Skill。
- `~/.claude/commands/pet.md`：命令说明。

诊断：

```bash
node ~/.claude/status-pet/scripts/pet.js doctor
```

## 常用命令

```bash
# 查看和切换宠物
node ~/.claude/status-pet/scripts/pet.js list
node ~/.claude/status-pet/scripts/pet.js switch pico

# 互动
node ~/.claude/status-pet/scripts/pet.js care
node ~/.claude/status-pet/scripts/pet.js feed
node ~/.claude/status-pet/scripts/pet.js play
node ~/.claude/status-pet/scripts/pet.js pet
node ~/.claude/status-pet/scripts/pet.js nap

# 报告、成长、健康
node ~/.claude/status-pet/scripts/pet.js health
node ~/.claude/status-pet/scripts/pet.js growth
node ~/.claude/status-pet/scripts/pet.js report
node ~/.claude/status-pet/scripts/pet.js report week
node ~/.claude/status-pet/scripts/pet.js achievements

# 外观
node ~/.claude/status-pet/scripts/pet.js quick cute
node ~/.claude/status-pet/scripts/pet.js quick --pet pico --lang zh --mode panel --rows 2 --hide cost,elapsed
node ~/.claude/status-pet/scripts/pet.js theme cute
node ~/.claude/status-pet/scripts/pet.js theme focus
node ~/.claude/status-pet/scripts/pet.js config set language zh
node ~/.claude/status-pet/scripts/pet.js config set displayMode panel
```

## 快捷配置

想快速配置宠物和状态栏，优先用 `quick`：

```bash
node ~/.claude/status-pet/scripts/pet.js quick cute
node ~/.claude/status-pet/scripts/pet.js quick focus --pet byte
node ~/.claude/status-pet/scripts/pet.js quick --pet pico --lang zh --mode panel --rows 2
node ~/.claude/status-pet/scripts/pet.js quick --show git,context,tasks --hide cost,elapsed
```

内置快捷方案：

- `cute`：可爱中文面板，更多随机事件。
- `focus`：低打扰两行面板。
- `full`：完整信息。
- `clean`：干净紧凑。
- `quiet`：只保留宠物。

可显示/隐藏的常用字段：`model`、`cwd`、`git`、`changes`、`context`、`tasks`、`cost`、`elapsed`、`tool`、`stats`、`vitals`、`flair`、`name`。

## 宠物

内置宠物：

- `byte`：默认 ASCII 小宠物，兼容性最好。
- `mono`：极简纯 ASCII。
- `orbit`：Unicode 圆点风格。
- `spark`：活泼火花风格。
- `pico`：更像小宠物的小方块形象。

预览：

```bash
node ~/.claude/status-pet/scripts/pet.js preview pico
node ~/.claude/status-pet/scripts/pet.js preview --animate --action celebrate spark
```

## 显示模式

推荐只记这几个：

- `compact`：少量信息。
- `balanced`：默认平衡模式。
- `panel`：多行面板，信息更清楚。
- `full`：尽量显示完整信息。
- `quiet`：只显示宠物。

切换：

```bash
node ~/.claude/status-pet/scripts/pet.js config set displayMode panel
node ~/.claude/status-pet/scripts/pet.js config set panelRows 2
node ~/.claude/status-pet/scripts/pet.js config set panelCompact true
```

多行示例：

```text
[^o^] 工具完成 · Bash · 捡到一点火花
Sonnet · .../project · [████░░░░] 50% 上下文 · 1/2 任务
Lv.1 新来的 · 能▰▰▰▰▱ 亲▰▰▰▱▱ · 1 步 · 1 测试
```

## 主题包

主题包是比手动改配置更推荐的方式：

```bash
node ~/.claude/status-pet/scripts/pet.js theme focus
node ~/.claude/status-pet/scripts/pet.js theme cute
node ~/.claude/status-pet/scripts/pet.js theme dense
node ~/.claude/status-pet/scripts/pet.js theme night
node ~/.claude/status-pet/scripts/pet.js theme minimal
```

- `focus`：低打扰，两行面板。
- `cute`：更可爱，更多短句和随机事件。
- `dense`：信息密集，适合看 Git/context/tasks。
- `night`：夜间安静。
- `minimal`：最小显示。

## 配置

配置文件在：

```text
~/.claude/status-pet/config.json
```

现在配置文件只保存核心项和你改过的项。没有写出来的字段会使用程序内置默认值，所以文件可以很短，例如：

```json
{
  "pet": "pico",
  "language": "zh",
  "displayMode": "panel",
  "palette": "soft",
  "panelRows": 2
}
```

手动配置仍然可用：

```bash
node ~/.claude/status-pet/scripts/pet.js config get
node ~/.claude/status-pet/scripts/pet.js config get --full
node ~/.claude/status-pet/scripts/pet.js config set language zh
node ~/.claude/status-pet/scripts/pet.js config set language en
node ~/.claude/status-pet/scripts/pet.js config set displayMode panel
node ~/.claude/status-pet/scripts/pet.js config set petName Bytey
node ~/.claude/status-pet/scripts/pet.js config set show.petName true
node ~/.claude/status-pet/scripts/pet.js config set randomEventChance 0.08
node ~/.claude/status-pet/scripts/pet.js config set quietHours '[{"start":"22:30","end":"08:00"}]'
```

高级字段仍然支持，包括 `palette`、`style`、`cwdSegments`、`contextBarWidth`、`flairChance`、`careHintChance`、`companionPet`、`panelRows`、`panelCompact`、`show.*` 等。

## 成长和状态

宠物状态保存在全局档案里，切换会话或退出 Claude Code 后不会丢：

- 能量、亲密度
- 投喂、玩耍、摸摸、休息次数
- 成长等级、经验、解锁内容
- 心情日记、随机事件、最常用工具

查看：

```bash
node ~/.claude/status-pet/scripts/pet.js care
node ~/.claude/status-pet/scripts/pet.js growth
node ~/.claude/status-pet/scripts/pet.js health
```

## Skill 集成

总安装会同步 Skill。之后可以直接用自然语言让 Claude 操作宠物，例如：

- "切换到 pico"
- "喂一下宠物"
- "切换中文"
- "显示多行面板"
- "查看宠物健康"
- "应用 cute 主题"

Skill 会优先执行：

```bash
node ~/.claude/status-pet/scripts/pet.js <command>
```

## 开发和测试

```bash
npm test
node ./scripts/install-all.js --dry-run --pet byte
node ./scripts/pet.js validate
```

主要脚本：

- `scripts/pet.js`：统一入口。
- `scripts/pet-hook.js`：写入会话状态。
- `scripts/pet-statusline.js`：渲染状态栏。
- `scripts/pet-play.js`：互动和照护。
- `scripts/pet-growth.js`：成长系统。
- `scripts/pet-health.js`：综合健康面板。
- `scripts/doctor.js`：安装诊断。

## 卸载

```bash
node ~/.claude/status-pet/scripts/pet.js uninstall --dry-run
node ~/.claude/status-pet/scripts/pet.js uninstall --all
```

卸载会备份 `~/.claude/settings.json`，并移除本项目写入的 statusLine、hooks、运行文件、Skill 和 command。

## 常见问题

**状态栏没有显示**

先重启 Claude Code，然后运行：

```bash
node ~/.claude/status-pet/scripts/pet.js doctor
```

**切换宠物后没变化**

如果设置了环境变量 `CLAUDE_STATUS_PET`，它会覆盖配置文件。否则重启 Claude Code 即可。

**配置文件为什么很短**

这是正常的。未写出的字段会自动使用默认值，功能不会减少。
