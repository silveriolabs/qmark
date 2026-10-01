# QMark

[![npm version](https://img.shields.io/npm/v/@silverio-labs/qmark-core.svg)](https://www.npmjs.com/package/@silverio-labs/qmark-core)
[![License](https://img.shields.io/badge/License-Free%20use%2C%20no%20modification-blue.svg)](LICENSE)

QMark turns a quiz you write in a text file into a printable slide deck or a web quiz you can run in the browser. If you are in **academe**, you can use it for **self-study**: turn your notes, textbook chapters, and slides into practice that feels like review—not busywork.

Start here: [silverio-labs.com/qmark](https://silverio-labs.com/qmark)

## Who is QMark for?

**You, if you are learning in academe.** Whether you are in **K–12**, **undergraduate**, or **graduate** school, QMark helps you build chapter quizzes, exam prep, and lab follow-ups you can reuse all term. **Primary:** one file per quiz or unit as `<quiz-name>.qmc.yml` (for example `1-science-quiz.qmc.yml`). **Optional:** at most one `qmark-compose.yml` per folder when you want a fixed root file. Export PDF or HTML to study on your laptop or phone.

Teachers and faculty use the same files for class reviews. Training teams use them for onboarding and refreshers. The format is the same; the benefit for you is **active recall** on your own schedule, with optional images linked to each question when your course is visual (diagrams, excerpts, scores, code).

## How to name your quiz files

QMark reads **`<quiz-name>.qmc.yml`** modules and, if present, a single optional **`qmark-compose.yml`**. Other files in the folder are ignored.

| Priority | File name | When to use it |
|----------|-----------|----------------|
| **Primary** | `<quiz-name>.qmc.yml` | One quiz, chapter, exam, or unit per file—for example [`1-medical-quiz.qmc.yml`](_quiz_samples/1-medical-quiz.qmc.yml) or [`2-science-quiz.qmc.yml`](_quiz_samples/2-science-quiz.qmc.yml). A folder can be **modules only** (usual layout). |
| **Optional** | `qmark-compose.yml` | At most **one** per folder—a root file or legacy single-file quiz; merged **before** `.qmc.yml` files in filename order when both exist. |

Worked examples: [`_quiz_samples/1-medical-quiz.qmc.yml`](_quiz_samples/1-medical-quiz.qmc.yml), [`_quiz_samples/2-science-quiz.qmc.yml`](_quiz_samples/2-science-quiz.qmc.yml), and optional [`_quiz_samples/qmark-compose.yml`](_quiz_samples/qmark-compose.yml). Writing rules: [`_quiz_samples/ROADMAP.md`](_quiz_samples/ROADMAP.md).

Each file needs a title (`name`), a version, and at least one section of questions. Question types you can use: multiple choice, select-all-that-apply, true/false, fill in the blank, short answer, matching, and put-in-order. Photos are optional.

## Make a PDF or a slideshow

Install the command-line tool, then point it at a file or a folder:

```bash
npm install -g @silverio-labs/qmark-cli@latest
qmark compile ./2-science-quiz.qmc.yml --html
qmark compile ./my-quiz-folder --pdf
qmark compile ./qmark-compose.yml --pdf   # optional single-file name
```

PDF and HTML are free. The file lands in a `qmark-out` folder next to where you ran the command. Editable PowerPoint and other Pro features are on [silverio-labs.com/qmark](https://silverio-labs.com/qmark).

| What you can do | Free | Pro |
|-----------------|------|-----|
| YAML parse, lint, compile to AST | Yes | Yes |
| HTML slides (`--html`) and PDF (`--pdf`) | Yes | Yes |
| SVG slides (`--svg`) | Yes | Yes |
| PNG export (CLI) | Planned | Planned |
| Export attribution (“Made with ♥ by silverio-labs”) on exports | Shown | Removed (`--tier pro`) |
| Editable PPTX (`--pptx`) | No | Licensed (not shipped yet) |
| Animations, branded themes, timers, collaboration | No | Pro roadmap |
| Cloud uploads, confidentiality | No | Enterprise options |

Pro features are gated with `requireFeature`; some Pro ids (for example PPTX) are licensed but not implemented in the CLI yet.

## For developers

`@silverio-labs/qmark-core` checks the YAML and returns a quiz object (`QuizAst`). `@silverio-labs/qmark-cli` reads a file or directory from disk and writes PDF or HTML.

```text
<quiz-name>.qmc.yml (primary) and optional qmark-compose.yml
  → validate → QuizAst → web UI | --pdf | --html | --svg | --pptx (Pro)
```

```bash
npm install @silverio-labs/qmark-core@latest
```

```typescript
import { parseQuizFromYaml, compileComposeDirectory } from '@silverio-labs/qmark-core';

const ast = parseQuizFromYaml(yamlString);
```

| API | Use |
|-----|-----|
| `parseQuizFromYaml(yaml)` | One YAML string → `QuizAst` |
| `compileComposeDirectory(files)` | `{ path, content }[]` using the same merge rules as the CLI |
| `renderHtmlSlideDeck(ast, { tier })` | Static HTML slides; free tier includes attribution |
| `renderSvgSlideDeck(ast, { tier })` | Static SVG slides; same tier attribution rules |
| `shouldWatermarkExport(tier)` | Whether exports include the free-tier attribution |
| `requireFeature(tier, feature)` | Throws when a Pro feature is used on the free tier |

CLI flags: `--pdf`, `--html`, `--svg`, `-o` / `--output`, `--pptx` (Pro), `--tier free|pro|enterprise`, `-h`. Use `qmark lint` before compile in CI.

From this repo:

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

```text
qmark/
├── _quiz_samples/  # writing rules and example quizzes
├── packages/core/  # @silverio-labs/qmark-core
├── packages/cli/   # @silverio-labs/qmark-cli
└── apps/           # playground and editor preview (planned)
```

## License

You may use and share QMark as provided. You may not modify it or build derivative works. Pro features need a subscription from [silverio-labs.com/qmark](https://silverio-labs.com/qmark). See [LICENSE](LICENSE).
