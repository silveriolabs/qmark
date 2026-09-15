Phase 1: Core Engine & Syntax (Steps 1–3)
1. Define the Canonical YAML Schema

Draft the base specification for questions, answer keys, photo anchor coordinates, and theme metadata. Keep it concise so non-technical instructors and L&D managers can write it intuitively.

2. Build the Client-Side Engine (@qmark/core)

Develop the standalone JavaScript core that parses the YAML string and renders interactive HTML5 Canvas or SVG/PNG visual output directly in the browser.

3. Publish to npm

Package the core rendering engine into a single npm library. Pushing updates here creates a single source of truth that automatically flows downstream into all future shells.

## Rules

How to write `qmark-compose.yaml`. Full example: `_docs/qmark-compose.yaml`.

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
- `photo_anchor` — only when `photo` is set: `top-left` | `top-right` | `bottom-left` | `bottom-right` | `center`

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