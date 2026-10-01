Phase 1: Core Engine & Syntax (Steps 1–3)
1. Define the Canonical YAML Schema

Draft the base specification for questions, answer keys, photo anchor coordinates, and theme metadata. Keep it concise so non-technical instructors and L&D managers can write it intuitively.

2. Build the Client-Side Engine (@qmark/core)

Develop the standalone JavaScript core that parses the YAML string and renders interactive HTML5 Canvas or SVG/PNG visual output directly in the browser.

3. Publish to npm

Package the core rendering engine into a single npm library. Pushing updates here creates a single source of truth that automatically flows downstream into all future shells.

## Rules

How to write quiz YAML. **Primary filename:** `<quiz-name>.qmc.yml` (one quiz or unit per file). Examples: `_quiz_samples/1-medical-quiz.qmc.yml`, `_quiz_samples/2-science-quiz.qmc.yml`. **Optional:** `_quiz_samples/qmark-compose.yml` (at most one per folder).

### Project layout

- **Primary (recommended):** one or more `<quiz-name>.qmc.yml` files in a folder (e.g. `math.qmc.yml`, `1-medical-quiz.qmc.yml`). Modules-only folders are valid full quizzes.
- **Optional root file:** at most one `qmark-compose.yml` (`.yaml` also accepted), merged before `.qmc.yml` files when both are present.
- **Compiler / CLI:** pass a **file** (`*.qmc.yml` or `qmark-compose.yml`) or a **directory**; the engine loads optional `qmark-compose.yml` and every `*.qmc.yml`, then merges into one AST.

### Document

- Start with `version` and `name`.
- Group items under `sections`. Each section has `sectionType`, `instructions`, `goal`, and `questions`.
- `instructions` tells the learner how to answer the section.
- `goal` states what the section is testing.
- Prefer unquoted YAML. Quote a value only if it would be misread (`yes`, `no`, `null`, `1.0`, or text with `: ` or `#`).
- Use camelCase for `sectionType`. Use kebab-case for `type` and `photo_anchor`.

### Every question

Required:

- `question` — stem shown to the learner
- `type` — one of `multiple-choice` | `multiple-select` | `boolean` | `fill-blank` | `short-answer` | `matching` | `ordering`
- `answer` — shape depends on `type` (see below)

Optional:

- `theme` — topic label
- `difficulty` — `easy` | `medium` | `hard`
- `photo` — image URL
- `photo_anchor` — only when `photo` is set: `left` | `right` | `top-left` | `top-right` | `bottom-left` | `bottom-right` | `center`

### Type rules

**multiple-choice** — exactly one correct option.

- `options` is a list of choices.
- `answer` is one string and must appear in `options`.

**multiple-select** — one or more correct options.

- `options` is a list of choices.
- `answer` is a list. Every entry must appear in `options`.

**boolean** — true or false.

- No `options`.
- `answer` is `true` or `false` (unquoted booleans, not the words True/False).

**fill-blank** — missing word in the stem.

- Put `____` in `question` where the blank is.
- `answer` is a string (or a list of acceptable strings).
- No `options`.

**short-answer** — free text.

- No `options`.
- `answer` is a string (or a list of acceptable strings).

**matching** — pair left items with right.

- `left` and `right` are lists of the same length.
- `answer` is a map: each `left` key to its `right` value.
- Every key in `answer` must be in `left`; every value in `right`.

**ordering** — put items in the correct sequence.

- `options` is the shuffled list shown to the learner.
- `answer` is the same items in the correct order.

### Photos

- `photo` is optional. Omit both `photo` and `photo_anchor` when there is no image.
- Do not set `photo_anchor` without `photo`.
- `photo` must be `https://…`, `http://…`, or `s3://bucket/key` (the bucket must allow public reads). Default anchor is `right`.
- HTML export links to the absolute URL. PDF export downloads the image at build time, so it must be public PNG or JPEG.

### Linting

- Run `qmark lint <file-or-folder>` before compiling. Each problem is reported as `file:line:col` with the offending line and a `fix:` hint.
- Errors (schema violations, YAML syntax) block `qmark compile`. Warnings do not: unknown keys (silently ignored otherwise), duplicate question stems, and photo hosts that often block hotlinking.
- Cross-field rules (for example `answer` must appear in `options`) are checked once the question's fields have valid types, so fix type errors first and re-run.