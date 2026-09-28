# QMark Suite

[![npm version](https://img.shields.io/npm/v/@silverio-labs/qmark-core.svg)](https://www.npmjs.com/package/@silverio-labs/qmark-core)
[![License](https://img.shields.io/badge/License-Free%20use%2C%20no%20modification-blue.svg)](LICENSE)

**QMark** parses declarative YAML questionnaires into **web-based interactive quizzes** and **presentation slide decks** (HTML slides / PDF today; PPTX on Pro).

Built for **academe** and **enterprise L&D**: authors write compose YAML once; `@silverio-labs/qmark-core` validates and normalizes to an AST; `@silverio-labs/qmark-cli` exports from local folders.

```text
qmark-compose.yml (+ optional *.qmc.yml)
        →  parse & validate  →  QuizAst
        →  web quiz (your React/Next.js UI)  |  --html / --pdf (CLI)  |  --pptx (Pro)
```

**Supported item types:** `multiple-choice`, `multiple-select`, `boolean`, `fill-blank`, `short-answer`, `matching`, `ordering`. Photos and media URLs are optional.

**Authoring:** [`_docs/ROADMAP.md`](_docs/ROADMAP.md) · **Example compose:** [`_docs/qmark-compose.yml`](_docs/qmark-compose.yml) · **Science module:** [`_docs/1-science-quiz.qmc.yml`](_docs/1-science-quiz.qmc.yml)

---

## Compose files & directory compiler

| Input | Convention |
|--------|------------|
| Single quiz | `qmark-compose.yml` (or `.yaml`) |
| Extra parts | `<name>.qmc.yml` (e.g. `1-science-quiz.qmc.yml`) |
| CLI / compiler path | Pass a **directory** (or a single file) |

When you pass a **directory**, the engine:

1. Loads **`qmark-compose.yml`** if present (at most one).
2. Loads every **`*.qmc.yml`** / `*.qmc.yaml` in that folder, sorted by filename.
3. **Merges** into one AST: compose sections first, then modules; quiz names combine when they differ.

| Folder contents | Merged result |
|-----------------|---------------|
| Only `qmark-compose.yml` | That quiz |
| Only `*.qmc.yml` | Modules merged (sorted) |
| Compose + modules | Compose, then modules |

Each file must be a full document: `version`, `name`, and `sections` (see ROADMAP).

---

## CLI (`qmark compile`)

Build the CLI from the monorepo, then run `qmark` (or `node packages/cli/dist/bin.js`):

```bash
pnpm install
pnpm build
qmark compile <file-or-directory> [options]
```

### Flags

| Flag | Tier | Description |
|------|------|-------------|
| `--pdf` | Free | Export a PDF slide-style deck from the merged AST |
| `--html` | Free | Export a static full-screen HTML slide deck |
| `-o`, `--output` | — | Output file path (default: `./qmark-out/<quiz-name>.pdf` or `.html`) |
| `--pptx` | Pro | Editable PowerPoint (gated; pipeline coming soon) |
| `--tier` | — | `free` (default), `pro`, or `enterprise` — controls feature gates |
| `-h`, `--help` | — | Show usage |

You must pass at least one export flag: `--pdf`, `--html`, or `--pptx`.

### Examples

```bash
# Directory: compose + modules → one PDF
qmark compile ./sample --pdf

# Example compose in _docs
qmark compile ./_docs --pdf -o ./out/quiz.pdf

# HTML slideshow (browser or print to PDF)
qmark compile ./_docs --html

# Single science module
qmark compile ./_docs/1-science-quiz.qmc.yml --pdf
```

Default CLI output directory: `./qmark-out/` (gitignored).

---

## Core (`@silverio-labs/qmark-core`)

Use in **Next.js / React** when you want your own full-screen quiz or slideshow UI (free tier).

| API | Purpose |
|-----|---------|
| `parseQuizFromYaml(yaml)` | Raw compose string → validated **QuizAst** |
| `compileComposeYaml` / `compileComposeDirectory` | Same as CLI merge rules; directory API takes `{ path, content }[]` (no Node `fs` required) |
| `compile({ kind: 'yaml' \| 'file' \| 'directory', ... })` | Unified compiler entry |
| `renderHtmlSlideDeck(ast)` | Static HTML slides from AST |
| `requireFeature(tier, feature)` | Free vs Pro gates (`PaidFeatureError` on paid-only features) |

```typescript
import { parseQuizFromYaml } from '@silverio-labs/qmark-core';

const ast = parseQuizFromYaml(yamlString);
// ast.sections → your interactive quiz or custom slideshow
```

For a folder on disk in app code, read files yourself and call `compileComposeDirectory(files)`.

---

## Tier architecture

| Capability | Free (local use) | Paid (Pro / Enterprise) |
|------------|------------------------------|-------------------------|
| YAML → AST, custom web UI | ✓ | ✓ |
| CLI `--pdf`, `--html` | ✓ | ✓ |
| Static SVG/PNG/HTML export (core) | ✓ | ✓ |
| CLI `--pptx` | — | ✓ (when shipped) |
| Animations, branded themes, hosted timers | Default layout | ✓ |
| Cloud workspace, co-authoring, uploads | Local YAML | ✓ |
| Confidential hosting, compliance | — | ✓ |

---

## Development

```bash
pnpm install
pnpm typecheck
pnpm test      # core compile tests + CLI smoke test
pnpm build     # packages/core + packages/cli → dist/
```

---

## Roadmap (summary)

**Phase 1 — `packages/`:** schema, AST, web render drivers, HTML/PDF export, PPTX (Pro).  
**Phase 2 — CLI & apps:** playground (`apps/web`), VS Code preview (`apps/vscode`).  
**Phase 3:** headless LMS / SCORM / xAPI integrations.

See workspace layout:

```text
qmark/
├── _docs/              # ROADMAP, qmark-compose.yml, 1-science-quiz.qmc.yml
├── sample/             # Optional *.qmc.yml modules for directory demos
├── packages/
│   ├── core/           # @silverio-labs/qmark-core
│   └── cli/            # @silverio-labs/qmark-cli
├── apps/               # web playground, vscode (planned)
├── package.json
└── pnpm-workspace.yaml
```

---

## License

Free to **use and redistribute unmodified**. **Modification and derivative works are not allowed.** Pro and Enterprise features require a paid license or subscription from Silverio Labs. See [LICENSE](LICENSE).
