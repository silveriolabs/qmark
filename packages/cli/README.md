# @silverio-labs/qmark-cli

Turn a QMark quiz file into a PDF or an HTML slideshow from the terminal—handy when **you** want printable or offline review for a class, exam, or lab without building a full app.

Name a single quiz **`qmark-compose.yml`**. Name extra parts **`something.qmc.yml`**, for example `1-science-quiz.qmc.yml`. You can pass one file, or a folder that contains the main file and any `.qmc.yml` parts. QMark merges that folder into one quiz.

**Learn more and stay up to date**

- **Official site** — product overview, Pro features, and docs: [silverio-labs.com/qmark](https://silverio-labs.com/qmark)
- **Git repository** — examples, schema rules, sample `.qmc.yml` files, and issues: [github.com/silveriolabs/qmark](https://github.com/silveriolabs/qmark)

We recommend bookmarking both: the site for releases and licensing, the repo for copy-paste samples and the latest writing rules.

```bash
npm install -g @silverio-labs/qmark-cli@latest
qmark lint ./my-quiz-folder
qmark compile ./qmark-compose.yml --pdf
qmark compile ./2-science-quiz.qmc.yml --html
qmark compile ./my-quiz-folder --pdf
```

PDF and HTML are free. The result is written to `qmark-out` unless you pass `-o` with a file path. Editable PowerPoint (`--pptx`) is part of [QMark Pro](https://silverio-labs.com/qmark).

## Checking your quiz file

`qmark lint` checks a file or folder and tells you the exact line to fix:

```
_quiz_samples/1-medical-quiz.qmc.yml:22:23 error invalid-enum sections.0.questions.0.photo_anchor
  invalid photo_anchor "sideways"
  22 |         photo_anchor: sideways
     |                       ^^^^^^^^
  fix: use one of left, right, top-left, top-right, bottom-left, bottom-right, center
```

Errors stop `compile`. Warnings (unknown keys, duplicate questions, image hosts that often block hotlinking) are printed but don't stop the build. `qmark compile` runs the same checks first.

## For developers

Commands: `qmark compile <path>` and `qmark lint <path> [--format text|json]`. `lint` exits 1 on errors and 0 when there are only warnings; `--format json` is meant for editors and CI.

Compile flags: `--pdf`, `--html`, `-o` / `--output`, `--pptx`, `--tier free|pro|enterprise`, `-h`.

The command reads `qmark-compose.yml` and `*.qmc.yml` / `*.qmc.yaml` only. Other files in the folder are skipped.

Source, changelog, and sample quizzes: [github.com/silveriolabs/qmark](https://github.com/silveriolabs/qmark). Product and support: [silverio-labs.com/qmark](https://silverio-labs.com/qmark).
