# QMark Suite

[![npm version](https://img.shields.io/npm/v/@silverio-labs/qmark-core.svg)](https://www.npmjs.com/package/@silverio-labs/qmark-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**QMark** turns a single YAML questionnaire (`qmark-compose.yaml`) into a **parseable quiz format** that can be delivered as a **web-based quiz** or a **presentation deck (PPTX / HTML slides)**.

Instructors and enterprise L&D authors write questions and answers once. `@silverio-labs/qmark-core` parses and validates that file, then renders or exports it for the classroom, LMS, or training session.

```text
qmark-compose.yaml  →  parse & validate  →  web quiz  |  PPTX / HTML slides
```

Supported item types: `multiple-choice`, `multiple-select`, `boolean`, `fill-blank`, `short-answer`, `matching`, `ordering`. Photos are optional.

Authoring rules: [`_docs/ROADMAP.md`](_docs/ROADMAP.md). Worked example: [`_docs/qmark-compose.yaml`](_docs/qmark-compose.yaml).

---

## Purpose & Scope

This monorepo holds the compose schema, the core parser/renderer (`packages/core`), and future CLI and app shells. The compose file is the source of truth; web and slide outputs are views of the same parsed quiz.

Use it when you need assessments that are easy for non-engineers to write and consistent across **academe** and **enterprise L&D**.

---

## Technical roadmap

### Phase 1: Parseable format and core engine

1. **Workspace** — TypeScript + `pnpm` + `tsup` for `@silverio-labs/qmark-core`.
2. **Schema** — YAML parse + Zod validation for `qmark-compose.yaml`.
3. **AST** — Normalize validated compose into a quiz AST (sections, instructions, goals, items, answers).
4. **Web quiz** — Client-side render of the AST as an interactive quiz (DOM / Canvas / SVG).
5. **Slides** — Compile the same AST into HTML slide decks and PPTX.
6. **Export** — Client-side export: PPTX, HTML, PDF, PNG.

### Phase 2: Authoring shells

7. **CLI** (`@silverio-labs/qmark-cli`) — Compile a compose file to a web quiz bundle or PPTX.
8. **Web playground** — Live preview of quiz and slides from YAML.
9. **VS Code extension** — Preview quizzes and slides in the editor.

### Phase 3: Integrations

10. **Headless export** — APIs for LMS (SCORM / xAPI), presentation suites, and private cloud wrappers.

---

## Workspace

```text
qmark-suite/
├── _docs/
│   ├── ROADMAP.md           # Authoring rules for qmark-compose.yaml
│   └── qmark-compose.yaml   # Example questionnaire
├── packages/
│   ├── core/                # @silverio-labs/qmark-core (parse, render, export)
│   └── cli/                 # @silverio-labs/qmark-cli (web / PPTX builds)
├── apps/
│   ├── web/                 # Web playground
│   └── vscode/              # Editor preview
├── package.json
└── pnpm-workspace.yaml
```
