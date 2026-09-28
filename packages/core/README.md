# @silverio-labs/qmark-core

Parse and validate `qmark-compose.yml` (and `*.qmc.yml` modules) into a normalized quiz AST for web UIs and slide export.

```bash
npm install @silverio-labs/qmark-core
```

```typescript
import { parseQuizFromYaml } from '@silverio-labs/qmark-core';

const ast = parseQuizFromYaml(yamlString);
```

Free tier includes YAML parsing, directory merge, and static HTML slides (`renderHtmlSlideDeck`). Editable PPTX, animations, branded themes, hosted timers, and collaboration require a QMark Pro subscription.

Authoring rules and examples: [github.com/silveriolabs/qmark](https://github.com/silveriolabs/qmark).
