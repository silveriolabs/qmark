# @silverio-labs/qmark-core

Parse **`qmark-compose.yml`** or **`*.qmc.yml`** into a quiz AST for web UIs and slide export.

- **`qmark-compose.yml`** is the single-quiz file.
- **`<name>.qmc.yml`** is one part of a multi-file quiz. Pass every file in the folder to `compileComposeDirectory`.

```bash
npm install @silverio-labs/qmark-core
```

```typescript
import { parseQuizFromYaml } from '@silverio-labs/qmark-core';

const ast = parseQuizFromYaml(yamlString);
```

Free tier includes YAML parsing, directory merge, and static HTML slides (`renderHtmlSlideDeck`). Editable PPTX, animations, branded themes, hosted timers, and collaboration are on [QMark Pro](https://silverio-labs.com/qmark).

Authoring rules and examples: [github.com/silveriolabs/qmark](https://github.com/silveriolabs/qmark) · [silverio-labs.com/qmark](https://silverio-labs.com/qmark)
