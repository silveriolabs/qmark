import { parse as parseYaml } from 'yaml';
import { ComposeValidationError, type ComposeIssue } from '../errors';
import {
  composeDocumentSchema,
  type ComposeDocument,
} from '../schema/compose';

function formatZodIssues(
  issues: { path: (string | number)[]; message: string }[],
): ComposeIssue[] {
  return issues.map((issue) => ({
    path: issue.path.length > 0 ? issue.path.join('.') : '(root)',
    message: issue.message,
  }));
}

export function parseComposeYaml(content: string, source = 'compose'): ComposeDocument {
  let parsed: unknown;
  try {
    parsed = parseYaml(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ComposeValidationError(`Invalid YAML in ${source}`, [
      { path: '(yaml)', message },
    ]);
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new ComposeValidationError(`Expected a YAML mapping in ${source}`, [
      { path: '(root)', message: 'Document must be a mapping' },
    ]);
  }

  const result = composeDocumentSchema.safeParse(parsed);
  if (!result.success) {
    const issues = formatZodIssues(result.error.issues);
    throw new ComposeValidationError(
      `Compose validation failed for ${source}`,
      issues,
    );
  }

  return result.data;
}
