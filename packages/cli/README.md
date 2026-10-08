# @silverio-labs/qmark-cli

Turn a QMark quiz file into a PDF or an HTML slideshow from the terminal—handy when **you** want printable or offline review for a class, exam, or lab without building a full app.

**Primary:** name each quiz or unit **`<quiz-name>.qmc.yml`**, for example `1-science-quiz.qmc.yml`. **Optional:** at most one **`qmark-compose.yml`** per folder when you want a root file. Pass one module file, a modules-only folder, or a folder with compose plus modules. QMark merges directory inputs into one quiz.

**Learn more and stay up to date**

- **Official site** — product overview, Pro features, and docs: [silverio-labs.com/qmark](https://silverio-labs.com/qmark)
- **Git repository** — examples, schema rules, sample `.qmc.yml` files, and issues: [github.com/silveriolabs/qmark](https://github.com/silveriolabs/qmark)

We recommend bookmarking both: the site for releases and licensing, the repo for copy-paste samples and the latest writing rules.

```bash
npm install -g @silverio-labs/qmark-cli@latest
qmark lint ./my-quiz-folder
qmark compile ./2-science-quiz.qmc.yml --html
qmark compile ./my-quiz-folder --pdf
qmark compile ./my-quiz-folder --svg
qmark compile ./qmark-compose.yml --pdf
```

PDF, HTML, and SVG are free (with export attribution on the free tier). The result is written to `qmark-out` unless you pass `-o` with a file path. Pass `--tier pro` for attribution-free exports. Editable PowerPoint (`--pptx`) is part of [QMark Pro](https://silverio-labs.com/qmark).

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

Compile flags: `--pdf`, `--html`, `--svg`, `-o` / `--output`, `--pptx`, `--tier free|pro|enterprise`, `-h`.

The command reads `*.qmc.yml` / `*.qmc.yaml` and optional `qmark-compose.yml` only. Other files in the folder are skipped.

Source, changelog, and sample quizzes: [github.com/silveriolabs/qmark](https://github.com/silveriolabs/qmark). Product and support: [silverio-labs.com/qmark](https://silverio-labs.com/qmark).

## License

QMark License (`LicenseRef-QMark`). Free to use, including commercially, and to share unmodified. Modifying or building derivative works is not allowed. Pro and Enterprise features need a subscription from [silverio-labs.com/qmark](https://silverio-labs.com/qmark). Full terms are in the `LICENSE` file shipped with this package.
