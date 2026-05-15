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

## 安装

推荐使用总安装脚本，在项目目录运行：

```bash
cd /path/to/claude-status-pet
node ./scripts/install-all.js --pet byte
```

然后重启 Claude Code。

## 切换宠物

内置四套宠物：`byte`、`orbit`、`spark`、`mono`。

```bash
node ~/.claude/status-pet/scripts/pet.js switch orbit
node ~/.claude/status-pet/scripts/pet.js list
```

## 命令入口

```bash
node ~/.claude/status-pet/scripts/pet.js install --pet byte
node ~/.claude/status-pet/scripts/pet.js install-all --pet byte
node ~/.claude/status-pet/scripts/pet.js list
node ~/.claude/status-pet/scripts/pet.js switch orbit
node ~/.claude/status-pet/scripts/pet.js preview
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
node ~/.claude/status-pet/scripts/pet.js doctor
node ~/.claude/status-pet/scripts/pet.js uninstall --dry-run
```

## 卸载

```bash
node ~/.claude/status-pet/scripts/uninstall.js
```

## License

MIT
