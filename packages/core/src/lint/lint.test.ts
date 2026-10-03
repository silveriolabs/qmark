import assert from 'node:assert/strict';
import {
  ComposeValidationError,
  lintComposeFiles,
  lintComposeYaml,
  parseComposeYaml,
  type LintDiagnostic,
} from '../index';

const header = `version: "1.0.0"
name: Lint fixture
sections:
  - sectionType: S
    goal: G
    instructions: I
    questions:
`;

function lint(questions: string, prefix = header): LintDiagnostic[] {
  return lintComposeYaml(prefix + questions, { source: 'fixture.qmc.yml' }).diagnostics;
}

function find(diagnostics: LintDiagnostic[], code: string): LintDiagnostic {
  const match = diagnostics.find((d) => d.code === code);
  assert.ok(match, `expected ${code} in ${JSON.stringify(diagnostics, null, 2)}`);
  return match;
}

// Clean document has no diagnostics.
{
  const result = lintComposeYaml(
    `${header}      - question: Water freezes at 0 C.
        type: boolean
        answer: true
`,
  );
  assert.equal(result.ok, true);
  assert.deepEqual(result.diagnostics, []);
}

// YAML syntax error.
{
  const diagnostics = lint('      - question: "unterminated\n        type: boolean\n');
  const d = diagnostics.find((x) => x.path === '(yaml)');
  assert.ok(d, JSON.stringify(diagnostics));
  assert.equal(d.severity, 'error');
  assert.match(d.code, /^yaml-/);
  // The parser reports unterminated scalars where it detects them (end of input).
  assert.ok(d.line >= 8);
}

// Bad enum: points at the value.
{
  const d = find(
    lint(`      - question: Pick
        type: multiple-choice
        options: [A, B]
        answer: A
        photo: https://example.com/a.png
        photo_anchor: sideways
`),
    'invalid-enum',
  );
  assert.equal(d.path, 'sections.0.questions.0.photo_anchor');
  assert.deepEqual([d.line, d.column], [13, 23]);
  assert.match(d.hint ?? '', /top-left/);
}

// Numeric version.
{
  const d = find(lint('', 'version: 1.0\nname: X\nsections: []\n'), 'invalid-type');
  assert.equal(d.path, 'version');
  assert.deepEqual([d.line, d.column], [1, 10]);
  assert.match(d.hint ?? '', /quote/);
}

// Missing ____ in fill-blank.
{
  const d = find(
    lint(`      - question: No blank
        type: fill-blank
        answer: x
`),
    'rule',
  );
  assert.equal(d.path, 'sections.0.questions.0.question');
  assert.deepEqual([d.line, d.column], [8, 19]);
}

// Answer not in options.
{
  const d = find(
    lint(`      - question: Pick
        type: multiple-choice
        options: [A, B]
        answer: C
`),
    'rule',
  );
  assert.equal(d.path, 'sections.0.questions.0.answer');
  assert.deepEqual([d.line, d.column], [11, 17]);
}

// Unknown key: warning pointing at the key.
{
  const diagnostics = lint(`      - question: Q
        type: boolean
        answer: true
        colour: red
`);
  const d = find(diagnostics, 'unknown-key');
  assert.equal(d.severity, 'warning');
  assert.deepEqual([d.line, d.column], [11, 9]);
}

// Missing required key: points at the parent mapping.
{
  const d = find(
    lint(`      - type: boolean
        answer: true
`),
    'missing-key',
  );
  assert.equal(d.path, 'sections.0.questions.0.question');
  assert.deepEqual([d.line, d.column], [8, 9]);
}

// photo_anchor without photo.
{
  const d = find(
    lint(`      - question: Q
        type: boolean
        answer: true
        photo_anchor: left
`),
    'rule',
  );
  assert.equal(d.path, 'sections.0.questions.0.photo_anchor');
  assert.deepEqual([d.line, d.column], [11, 23]);
}

// Unknown question type.
{
  const d = find(
    lint(`      - question: Q
        type: essay
        answer: x
`),
    'invalid-question-type',
  );
  assert.deepEqual([d.line, d.column], [9, 15]);
}

// Duplicate stems and fragile photo hosts are warnings only.
{
  const result = lintComposeYaml(
    `${header}      - question: Same
        type: boolean
        answer: true
        photo: https://encrypted-tbn0.gstatic.com/images?q=x
      - question: Same
        type: boolean
        answer: false
`,
  );
  assert.equal(result.ok, true);
  find(result.diagnostics, 'duplicate-question');
  find(result.diagnostics, 'fragile-photo-host');
}

// Folder-level rule: more than one compose file.
{
  const content = `${header}      - question: Q\n        type: boolean\n        answer: true\n`;
  const result = lintComposeFiles([
    { path: 'qmark-compose.yml', content },
    { path: 'qmark-compose.yaml', content },
  ]);
  assert.equal(result.ok, false);
  find(result.diagnostics, 'invalid-file-set');
}

// parseComposeYaml attaches line/column to issues.
{
  assert.throws(
    () => parseComposeYaml('version: 1\nname: X\nsections: []\n', 'x.yml'),
    (error: unknown) =>
      error instanceof ComposeValidationError &&
      error.issues.some((i) => i.path === 'version' && i.line === 1 && i.column === 10),
  );
}

console.log('lint tests passed');
