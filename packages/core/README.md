# @silverio-labs/qmark-core

This package reads a QMark quiz file and hands your app a structured quiz you can show on screen—useful for **self-study apps** and course tools in **K–12, undergraduate, and graduate** settings.

Write each quiz or unit as **`<quiz-name>.qmc.yml`** (primary)—for example `1-science-quiz.qmc.yml`. Optionally add at most one **`qmark-compose.yml`** per folder as a root file. QMark combines directory inputs into one quiz.

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

`parseQuizFromYaml` accepts one file’s text (typically a `<quiz-name>.qmc.yml` module). `compileComposeDirectory` accepts the same set of files the CLI would load from a folder. `renderHtmlSlideDeck(ast, { tier })` and `renderSvgSlideDeck(ast, { tier })` return static exports (free tier includes attribution). `shouldWatermarkExport` and `requireFeature` enforce tier rules.

PDF, HTML, and SVG export, and parsing, are free. PowerPoint, animations, branded themes, timers, and collaboration are on [QMark Pro](https://silverio-labs.com/qmark).

Sample modules and the full compose spec live in the [qmark repository](https://github.com/silveriolabs/qmark) (`_quiz_samples/`).

## License

QMark License (`LicenseRef-QMark`). Free to use, including commercially, and to share unmodified. Modifying or building derivative works is not allowed. Pro and Enterprise features need a subscription from [silverio-labs.com/qmark](https://silverio-labs.com/qmark). Full terms are in the `LICENSE` file shipped with this package.
