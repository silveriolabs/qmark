# QMark Suite

[![npm version](https://img.shields.io/npm/v/@silverio-labs/qmark-core.svg)](https://www.npmjs.com/package/@silverio-labs/qmark-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**QMark** parses declarative YAML questionnaires into formats for **web-based interactive quizzes** and **presentation slide decks** (PPTX / HTML slides).

Built for **academe** and **enterprise L&D**: instructors and training managers author assessments in compose YAML; `@silverio-labs/qmark-core` validates syntax and produces a normalized AST for custom React/Next.js UIs or export pipelines. `@silverio-labs/qmark-cli` compiles local project folders from the terminal.

```text
qmark-compose.yml (+ optional *.qmc.yml)  →  parse & validate  →  AST  →  web quiz  |  HTML/PDF slides  |  PPTX (Pro)
```

**Supported item types:** `multiple-choice`, `multiple-select`, `boolean`, `fill-blank`, `short-answer`, `matching`, `ordering`. Photos and media URLs are optional.

**Authoring spec:** [`_docs/ROADMAP.md`](_docs/ROADMAP.md) · **Example:** [`_docs/qmark-compose.yml`](_docs/qmark-compose.yml)

### Compose files

| Input | Convention |
|--------|------------|
| Single quiz | `qmark-compose.yml` (or `.yaml`) |
| Multi-part quiz | `<name>.qmc.yml` (e.g. `math.qmc.yml`, `science.qmc.yml`) |
| Compiler / CLI path | **Directory** — loads `qmark-compose.yml` and every `*.qmc.yml` in that folder, merges into one AST |

---

## Purpose & Scope

This monorepo houses the **parser**, **AST pipeline**, **web rendering drivers**, and **slide/export** layers (`packages/core`), plus the open-source **CLI** (`packages/cli`) and future app shells. One compose source drives interactive web quizzes and presentation outputs.

---

## Tier architecture

| Capability | Free (open source / local) | Paid (Pro / Enterprise) |
|------------|------------------------------|-------------------------|
| **Core** — YAML → AST (`parseQuizFromYaml` / `compileComposeYaml`) | ✓ | ✓ |
| **CLI** — `qmark compile <dir> --pdf` | ✓ | ✓ |
| **Export** — PDF, HTML slides, SVG/PNG (static) | ✓ | ✓ |
| **CLI / export** — editable `.pptx` | — | ✓ |
| **UI** — animations, branded themes, hosted timers | Default layout only | ✓ |
| **Platform** — cloud workspace, co-authoring, uploads | Local YAML only | ✓ |
| **Enterprise** — confidential hosting, compliance | — | ✓ |

Developers stay on the free loop (VS Code + CLI PDF + AST in Next.js). Corporate L&D upsells target PPTX, polish, collaboration, and security.

---

## 10-step technical roadmap

### Phase 1: Core engine & multi-format parsing (`packages/`)

1. **Zero-dependency architecture** — TypeScript, `pnpm`, `tsup` workspace.
2. **Schema & validation** — YAML parse + Zod runtime validation.
3. **AST transformation** — Normalized trees for web and slide layouts.
4. **Web quiz engine** — Client-side DOM / SVG / Canvas drivers.
5. **Slide engine** — HTML slide decks and PPTX compilation.
6. **Direct export** — Client-side PDF, HTML, PNG (PPTX gated on Pro).

### Phase 2: UI & CLI (`apps/`, `packages/cli`)

7. **CLI** (`@silverio-labs/qmark-cli`) — Local compile, web bundles, automated exports.
8. **Web playground** — Next.js live preview (quiz + slides).
9. **VS Code extension** — In-editor quiz and slide preview.

### Phase 3: Enterprise integration

10. **Headless APIs** — LMS (SCORM / xAPI), B2B suites, cloud wrappers.

---

## Workspace

```text
qmark-suite/
├── _docs/
│   ├── ROADMAP.md              # Authoring rules
│   └── qmark-compose.yml       # Example questionnaire
├── packages/
│   ├── core/                   # @silverio-labs/qmark-core
│   └── cli/                    # @silverio-labs/qmark-cli
├── apps/
│   ├── web/                    # Playground & live previewer
│   └── vscode/                 # Editor extension
├── package.json
└── pnpm-workspace.yaml
```

### Quick start (AST in React / Next.js)

```typescript
import { parseQuizFromYaml } from '@silverio-labs/qmark-core';

const ast = parseQuizFromYaml(yamlString);
// Build a full-screen slideshow or interactive quiz from ast.sections
```

### Quick start (CLI PDF)

```bash
pnpm --filter @silverio-labs/qmark-cli build
qmark compile ./my-quiz --pdf -o ./out/quiz.pdf
```

---

## License

MIT — see [LICENSE](LICENSE).
