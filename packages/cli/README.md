# @silverio-labs/qmark-cli

Compile **`qmark-compose.yml`** or **`*.qmc.yml`** from the terminal.

```bash
npm install -g @silverio-labs/qmark-cli
qmark compile ./qmark-compose.yml --pdf
qmark compile ./1-science-quiz.qmc.yml --html
qmark compile ./quiz-folder --pdf
```

A folder may contain `qmark-compose.yml`, any number of `*.qmc.yml` files, or both. The CLI merges them into one quiz.

`--pdf` and `--html` are free. `--pptx` and other Pro features are at [silverio-labs.com/qmark](https://silverio-labs.com/qmark).

Authoring rules and examples: [github.com/silveriolabs/qmark](https://github.com/silveriolabs/qmark)
