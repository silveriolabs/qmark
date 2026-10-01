export type LintSeverity = 'error' | 'warning';

export interface LintDiagnostic {
  /** File path or logical source name. */
  source: string;
  /** 1-based line of the offending node. */
  line: number;
  /** 1-based column of the offending node. */
  column: number;
  /** 1-based end line (inclusive), when known. */
  endLine?: number;
  /** 1-based end column (exclusive), when known. */
  endColumn?: number;
  /** Dotted document path, e.g. `sections.0.questions.2.answer`. `(yaml)` for syntax errors. */
  path: string;
  severity: LintSeverity;
  /** Stable, kebab-case diagnostic code, e.g. `invalid-enum`, `unknown-key`. */
  code: string;
  message: string;
  /** Short, actionable fix suggestion. */
  hint?: string;
}

export interface LintResult {
  /** `true` when there are no `error` diagnostics (warnings allowed). */
  ok: boolean;
  diagnostics: LintDiagnostic[];
}
