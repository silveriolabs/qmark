import { join, relative } from 'node:path';
import type { ComposeFileInput, LintDiagnostic } from '@silverio-labs/qmark-core';

/** Maps loader-relative file paths to cwd-relative paths so `file:line:col` is clickable. */
export function displayPathResolver(root: string): (source: string) => string {
  return (source) => {
    const absolute = join(root, source);
    const rel = relative(process.cwd(), absolute);
    return rel && !rel.startsWith('..') ? rel : absolute;
  };
}

const MAX_LINE = 100;
const MAX_CARET = 40;

function clip(sourceLine: string): string {
  return sourceLine.length > MAX_LINE ? `${sourceLine.slice(0, MAX_LINE)}…` : sourceLine;
}

function caretLine(sourceLine: string, d: LintDiagnostic): string {
  const lineEnd = sourceLine.trimEnd().length + 1;
  const start = Math.min(Math.max(1, d.column), MAX_LINE);
  const sameLine = d.endLine === undefined || d.endLine === d.line;
  const end = sameLine && d.endColumn && d.endColumn > start ? d.endColumn : lineEnd;
  const width = Math.max(1, Math.min(end, lineEnd, MAX_LINE + 1) - start, 0);
  return ' '.repeat(start - 1) + '^'.repeat(Math.min(width, MAX_CARET));
}

export function formatDiagnosticsText(
  diagnostics: LintDiagnostic[],
  files: ComposeFileInput[],
  displayPath: (source: string) => string,
): string {
  const linesBySource = new Map(files.map((f) => [f.path, f.content.split(/\r?\n/)]));
  const out: string[] = [];

  for (const d of diagnostics) {
    out.push(`${displayPath(d.source)}:${d.line}:${d.column} ${d.severity} ${d.code} ${d.path}`);
    out.push(`  ${d.message}`);
    const sourceLine = linesBySource.get(d.source)?.[d.line - 1];
    if (sourceLine !== undefined) {
      const gutter = String(d.line).length;
      out.push(`  ${d.line} | ${clip(sourceLine)}`);
      out.push(`  ${' '.repeat(gutter)} | ${caretLine(sourceLine, d)}`);
    }
    if (d.hint) out.push(`  fix: ${d.hint}`);
    out.push('');
  }

  const errors = diagnostics.filter((d) => d.severity === 'error').length;
  const warnings = diagnostics.length - errors;
  out.push(`${errors} error(s), ${warnings} warning(s)`);
  return out.join('\n');
}

export function formatDiagnosticsJson(
  diagnostics: LintDiagnostic[],
  displayPath: (source: string) => string,
): string {
  return JSON.stringify(
    diagnostics.map((d) => ({ ...d, source: displayPath(d.source) })),
    null,
    2,
  );
}
