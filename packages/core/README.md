# @silverio-labs/qmark-core

This package reads a QMark quiz file and hands your app a structured quiz you can show on screen—useful for **self-study apps** and course tools in **K–12, undergraduate, and graduate** settings.

Write the quiz as **`qmark-compose.yml`** (one quiz) or as **`*.qmc.yml`** files such as `1-science-quiz.qmc.yml` (one part each). A folder can hold the main file plus any number of `.qmc.yml` parts. QMark combines them into one quiz.

**Learn more and stay up to date**

- **Official site** — product overview, Pro features, and docs: [silverio-labs.com/qmark](https://silverio-labs.com/qmark)
- **Git repository** — examples, schema rules, sample `.qmc.yml` files, and issues: [github.com/silveriolabs/qmark](https://github.com/silveriolabs/qmark)

We recommend bookmarking both: the site for releases and licensing, the repo for copy-paste samples and the latest writing rules.

## For developers

```bash
npm install @silverio-labs/qmark-core@latest
```

```typescript
import { parseQuizFromYaml, compileComposeDirectory } from '@silverio-labs/qmark-core';

const ast = parseQuizFromYaml(yamlString);
// or compileComposeDirectory([{ path, content }, ...])
```

To check a file without throwing, use `lintComposeYaml(text, { source })` (or `lintComposeFiles(files)` for a folder). It returns `{ ok, diagnostics }`, where each diagnostic has `line`, `column`, `path`, `severity`, `code`, `message`, and an optional `hint` describing the fix:

```typescript
import { lintComposeYaml } from '@silverio-labs/qmark-core';

const { ok, diagnostics } = lintComposeYaml(yamlString, { source: 'quiz.qmc.yml' });
for (const d of diagnostics) {
  console.log(`${d.source}:${d.line}:${d.column} ${d.severity} ${d.message}`, d.hint ?? '');
}
```

`parseQuizFromYaml` accepts one file’s text. `compileComposeDirectory` accepts the same set of files the CLI would load from a folder. `renderHtmlSlideDeck(ast)` returns a static HTML slideshow. `requireFeature` blocks Pro-only features on the free tier.

PDF and HTML export, and parsing, are free. PowerPoint, animations, branded themes, timers, and collaboration are on [QMark Pro](https://silverio-labs.com/qmark).

Sample modules and the full compose spec live in the [qmark repository](https://github.com/silveriolabs/qmark) (`_quiz_samples/`).
