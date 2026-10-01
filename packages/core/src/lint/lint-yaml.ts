import { LineCounter, parseDocument, type Document } from 'yaml';
import { ComposeResolutionError } from '../errors';
import { resolveComposeDirectory, type ComposeFileInput } from '../compile/resolve-input';
import { resolvePhotoUrl } from '../photo/resolve-photo-url';
import {
  composeDocumentSchema,
  DOCUMENT_KEYS,
  QUESTION_KEYS,
  QUESTION_TYPES,
  SECTION_KEYS,
  type ComposeDocument,
} from '../schema/compose';
import { codeForIssue, hintForIssue, messageForIssue } from './hints';
import { locatePath, type LocateTarget } from './locate';
import type { LintDiagnostic, LintResult, LintSeverity } from './types';

export interface LintOptions {
  /** File path or logical name used in diagnostics. */
  source?: string;
}

/** Hosts that typically block hotlinking or serve expiring thumbnail URLs. */
const FRAGILE_PHOTO_HOSTS = ['encrypted-tbn0.gstatic.com', 'media.istockphoto.com'];

export interface ComposeAnalysis {
  diagnostics: LintDiagnostic[];
  /** Validated document, present only when there are no errors. */
  data?: ComposeDocument;
  syntaxError: boolean;
}

type Path = (string | number)[];

function joinPath(path: readonly (string | number)[]): string {
  return path.length > 0 ? path.join('.') : '(root)';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function sortDiagnostics(diagnostics: LintDiagnostic[]): LintDiagnostic[] {
  return diagnostics.sort(
    (a, b) =>
      a.source.localeCompare(b.source) || a.line - b.line || a.column - b.column,
  );
}

function collectWarnings(
  raw: unknown,
  emit: (path: Path, code: string, message: string, hint?: string, target?: LocateTarget) => void,
): void {
  if (!isRecord(raw)) return;

  const unknownKeys = (obj: Record<string, unknown>, allowed: readonly string[], base: Path) => {
    for (const key of Object.keys(obj)) {
      if (!allowed.includes(key)) {
        emit([...base, key], 'unknown-key', `unknown key "${key}" is ignored`,
          `remove it or use one of ${allowed.join(', ')}`, 'key');
      }
    }
  };

  unknownKeys(raw, DOCUMENT_KEYS, []);
  if (!Array.isArray(raw.sections)) return;

  const stems = new Map<string, string>();
  raw.sections.forEach((section, s) => {
    if (!isRecord(section)) return;
    unknownKeys(section, SECTION_KEYS, ['sections', s]);
    if (!Array.isArray(section.questions)) return;

    section.questions.forEach((question, q) => {
      if (!isRecord(question)) return;
      const base: Path = ['sections', s, 'questions', q];
      const type = question.type;
      if (typeof type === 'string' && (QUESTION_TYPES as readonly string[]).includes(type)) {
        unknownKeys(question, QUESTION_KEYS[type as (typeof QUESTION_TYPES)[number]], base);
      }

      if (typeof question.question === 'string') {
        const stem = question.question.trim().toLowerCase();
        const first = stems.get(stem);
        if (first) {
          emit([...base, 'question'], 'duplicate-question', `duplicate question stem (first at ${first})`,
            'reword or remove one of the duplicates');
        } else {
          stems.set(stem, joinPath(base));
        }
      }

      if (typeof question.photo === 'string') {
        const url = resolvePhotoUrl(question.photo);
        const host = url ? new URL(url).hostname : undefined;
        if (host && FRAGILE_PHOTO_HOSTS.includes(host)) {
          emit([...base, 'photo'], 'fragile-photo-host',
            `${host} often blocks hotlinking or expires; the image may not render`,
            'host the image somewhere stable (your site, S3, or a CDN)');
        }
      }
    });
  });
}

/**
 * Full analysis used by both {@link lintComposeYaml} and `parseComposeYaml`.
 * Never throws.
 */
export function analyzeComposeYaml(content: string, source = 'compose'): ComposeAnalysis {
  const lineCounter = new LineCounter();
  const doc: Document = parseDocument(content, { lineCounter, prettyErrors: false });
  const diagnostics: LintDiagnostic[] = [];

  const push = (
    severity: LintSeverity,
    path: Path,
    code: string,
    message: string,
    hint?: string,
    target: LocateTarget = 'value',
  ) => {
    const span = locatePath(doc, path, lineCounter, target);
    diagnostics.push({
      source,
      ...span,
      path: joinPath(path),
      severity,
      code,
      message,
      ...(hint ? { hint } : {}),
    });
  };

  const yamlProblems = [
    ...doc.errors.map((e) => ['error', e] as const),
    ...doc.warnings.map((e) => ['warning', e] as const),
  ];
  for (const [severity, problem] of yamlProblems) {
    const start = lineCounter.linePos(problem.pos[0]);
    const end = lineCounter.linePos(problem.pos[1]);
    diagnostics.push({
      source,
      line: start.line,
      column: start.col,
      endLine: end.line,
      endColumn: end.col,
      path: '(yaml)',
      severity,
      code: `yaml-${problem.code.toLowerCase().replace(/_/g, '-')}`,
      message: problem.message.split('\n')[0]!,
      hint: 'check indentation (spaces only) and that each key ends with ": "',
    });
  }
  if (doc.errors.length > 0) {
    return { diagnostics: sortDiagnostics(diagnostics), syntaxError: true };
  }

  const raw: unknown = doc.toJS();
  if (!isRecord(raw)) {
    push('error', [], 'not-a-mapping', 'document must be a YAML mapping',
      'start the file with version:, name:, and sections:');
    return { diagnostics: sortDiagnostics(diagnostics), syntaxError: false };
  }

  const result = composeDocumentSchema.safeParse(raw);
  if (!result.success) {
    for (const issue of result.error.issues) {
      push('error', issue.path, codeForIssue(issue), messageForIssue(issue), hintForIssue(issue));
    }
  }

  collectWarnings(raw, (path, code, message, hint, target) =>
    push('warning', path, code, message, hint, target),
  );

  return {
    diagnostics: sortDiagnostics(diagnostics),
    syntaxError: false,
    ...(result.success ? { data: result.data } : {}),
  };
}

/** Lints one compose or `*.qmc.yml` file. Never throws. */
export function lintComposeYaml(content: string, options: LintOptions = {}): LintResult {
  const { diagnostics } = analyzeComposeYaml(content, options.source ?? 'compose');
  return { ok: !diagnostics.some((d) => d.severity === 'error'), diagnostics };
}

/** Lints a set of files (single file or a quiz folder), including folder-level rules. */
export function lintComposeFiles(files: ComposeFileInput[]): LintResult {
  const diagnostics = files.flatMap(
    (file) => lintComposeYaml(file.content, { source: file.path }).diagnostics,
  );

  try {
    resolveComposeDirectory(files);
  } catch (error) {
    if (!(error instanceof ComposeResolutionError)) throw error;
    diagnostics.push({
      source: files[0]?.path ?? '(input)',
      line: 1,
      column: 1,
      path: '(files)',
      severity: 'error',
      code: 'invalid-file-set',
      message: error.message,
      hint: 'keep at most one qmark-compose.yml plus any number of *.qmc.yml files',
    });
  }

  return {
    ok: !diagnostics.some((d) => d.severity === 'error'),
    diagnostics: sortDiagnostics(diagnostics),
  };
}
