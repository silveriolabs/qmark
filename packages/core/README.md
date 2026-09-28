# @silverio-labs/qmark-core

Parse and validate `qmark-compose.yml` (and `*.qmc.yml` modules) into a normalized quiz AST for web UIs and slide export.

Monorepo overview: [../../README.md](../../README.md) · Authoring rules: [../../_docs/ROADMAP.md](../../_docs/ROADMAP.md)

## Layout

| Path | Purpose |
|------|---------|
| `src/schema/` | Zod compose schema |
| `src/parse/` | YAML parsing |
| `src/compile/` | Directory resolution + AST compile |
| `src/ast/` | AST types and normalization |
| `src/export/` | Free-tier HTML slide deck |
| `src/tier/` | Free vs paid feature gates |

## Scripts

```bash
pnpm typecheck
pnpm test    # compile smoke tests
pnpm build
```

Future roadmap items (Canvas/SVG renderers, PPTX in core) will live under new modules here—not duplicate empty stubs.
