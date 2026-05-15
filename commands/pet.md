---
description: Explain how to configure the Claude Code status pet.
---

Show the user how their Claude Code status-line pet is configured. Mention:

- The active pet is controlled by `CLAUDE_STATUS_PET` or the installed
  `config.json`.
- Available bundled pets are `byte`, `orbit`, `spark`, and `mono`.
- Display modes are `quiet`, `compact`, `balanced`, and `full`.
- Palettes are `mono`, `classic`, `soft`, `terminal`, and `alert`.
- Languages are `en` and `zh`.
- The pet tracks lightweight energy and bond values.
- The status line script is `scripts/pet-statusline.js`.
- Hook events update the pet state through `scripts/pet-hook.js`.
- `scripts/pet.js` is the unified CLI for install, install-all, list, switch,
  preview, config, care, report, achievements, demo, pack, import, setup,
  validate, create, doctor, and uninstall.
- Full installation is available through `scripts/install-all.js`.
- Pets can be switched with `scripts/pet-switch.js`.
- Pet frames can be previewed with `scripts/pet-preview.js`.
- Pet care actions are available through `scripts/pet.js care/feed/play/pet/nap`.
- Config changes are available through `scripts/pet.js config set <key> <value>`.
- Pet files can be validated with `scripts/pet-validate.js`.
- New pet templates can be created with `scripts/pet-create.js`.
- Activity reports are available through `scripts/pet.js report` and
  `scripts/pet.js report week`.
- Achievements are available through `scripts/pet.js achievements`.
- Pet sharing uses `scripts/pet.js pack <pet> <file.json>` and
  `scripts/pet.js import <file.json>`.
- Pet file names are restricted to lowercase letters, numbers, underscores, and
  hyphens; config edits should go through the CLI so values are normalized.
- Installation can be diagnosed with `scripts/doctor.js`.
- The plugin can be removed with `scripts/uninstall.js`.

Keep the answer concise and include exact commands only when the user asks to
change or debug the pet.
