import { ComposeValidationError } from '../errors';
import { analyzeComposeYaml } from '../lint/lint-yaml';
import type { ComposeDocument } from '../schema/compose';

export function parseComposeYaml(content: string, source = 'compose'): ComposeDocument {
  const { diagnostics, data, syntaxError } = analyzeComposeYaml(content, source);
  if (data) {
    return data;
  }

  const issues = diagnostics
    .filter((d) => d.severity === 'error')
    .map((d) => ({
      path: d.path,
      message: d.message,
      line: d.line,
      column: d.column,
      ...(d.hint ? { hint: d.hint } : {}),
    }));

  throw new ComposeValidationError(
    syntaxError ? `Invalid YAML in ${source}` : `Compose validation failed for ${source}`,
    issues,
  );
}
