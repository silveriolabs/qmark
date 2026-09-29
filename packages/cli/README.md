# @silverio-labs/qmark-cli

Turn a QMark quiz file into a PDF or an HTML slideshow from the terminal—handy when **you** want printable or offline review for a class, exam, or lab without building a full app.

Name a single quiz **`qmark-compose.yml`**. Name extra parts **`something.qmc.yml`**, for example `1-science-quiz.qmc.yml`. You can pass one file, or a folder that contains the main file and any `.qmc.yml` parts. QMark merges that folder into one quiz.

More about QMark: [silverio-labs.com/qmark](https://silverio-labs.com/qmark)

```bash
npm install -g @silverio-labs/qmark-cli@latest
qmark compile ./qmark-compose.yml --pdf
qmark compile ./1-science-quiz.qmc.yml --html
qmark compile ./my-quiz-folder --pdf
```

PDF and HTML are free. The result is written to `qmark-out` unless you pass `-o` with a file path. Editable PowerPoint (`--pptx`) is part of [QMark Pro](https://silverio-labs.com/qmark).

## For developers

Flags: `--pdf`, `--html`, `-o` / `--output`, `--pptx`, `--tier free|pro|enterprise`, `-h`.

The command reads `qmark-compose.yml` and `*.qmc.yml` / `*.qmc.yaml` only. Other files in the folder are skipped. Publishing and source: [github.com/silveriolabs/qmark](https://github.com/silveriolabs/qmark).
