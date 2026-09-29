# @silverio-labs/qmark-core

This package reads a QMark quiz file and hands your app a structured quiz you can show on screen—useful for **self-study apps** and course tools in **K–12, undergraduate, and graduate** settings.

Write the quiz as **`qmark-compose.yml`** (one quiz) or as **`*.qmc.yml`** files such as `1-science-quiz.qmc.yml` (one part each). A folder can hold the main file plus any number of `.qmc.yml` parts. QMark combines them into one quiz.

More about QMark: [silverio-labs.com/qmark](https://silverio-labs.com/qmark)

## For developers

```bash
npm install @silverio-labs/qmark-core@latest
```

```typescript
import { parseQuizFromYaml, compileComposeDirectory } from '@silverio-labs/qmark-core';

const ast = parseQuizFromYaml(yamlString);
// or compileComposeDirectory([{ path, content }, ...])
```

`parseQuizFromYaml` accepts one file’s text. `compileComposeDirectory` accepts the same set of files the CLI would load from a folder. `renderHtmlSlideDeck(ast)` returns a static HTML slideshow. `requireFeature` blocks Pro-only features on the free tier.

PDF and HTML export, and parsing, are free. PowerPoint, animations, branded themes, timers, and collaboration are on [QMark Pro](https://silverio-labs.com/qmark).

Examples and writing rules: [github.com/silveriolabs/qmark](https://github.com/silveriolabs/qmark)
