import { mergeQuizDocuments, normalizeDocument } from '../ast/normalize';
import type { QuizAst } from '../ast/types';
import { parseComposeYaml } from '../parse/parse-yaml';
import {
  type ComposeFileInput,
  isComposeFilename,
  resolveComposeDirectory,
} from './resolve-input';
import { ComposeResolutionError } from '../errors';

export interface CompileOptions {
  /** When compiling a single string, label used in validation errors. */
  source?: string;
}

/**
 * Parse and validate one compose YAML string, then normalize to the quiz AST.
 */
export function compileComposeYaml(
  content: string,
  options: CompileOptions = {},
): QuizAst {
  const source = options.source ?? 'qmark-compose.yml';
  const document = parseComposeYaml(content, source);
  return normalizeDocument(document, { source });
}

/**
 * Compile an explicit list of files. Use {@link compileComposeDirectory} when the
 * input represents a directory and compose vs module resolution is required.
 */
export function compileComposeFiles(files: ComposeFileInput[]): QuizAst {
  if (files.length === 0) {
    throw new ComposeResolutionError('At least one compose file is required');
  }

  if (files.length === 1) {
    const file = files[0]!;
    return compileComposeYaml(file.content, { source: file.path });
  }

  const asts = files.map((file, index) => {
    const document = parseComposeYaml(file.content, file.path);
    return normalizeDocument(document, {
      source: file.path,
      sourceIndex: index,
    });
  });

  return mergeQuizDocuments(asts);
}

/**
 * Compile a quiz directory: `*.qmc.yml` modules and optional `qmark-compose.yml` (compose first, then modules).
 */
export function compileComposeDirectory(files: ComposeFileInput[]): QuizAst {
  const resolved = resolveComposeDirectory(files);
  if (resolved.files.length === 1) {
    const file = resolved.files[0]!;
    return compileComposeYaml(file.content, { source: file.path });
  }

  const asts = resolved.files.map((file, index) => {
    const document = parseComposeYaml(file.content, file.path);
    return normalizeDocument(document, {
      source: file.path,
      sourceIndex: index,
    });
  });

  return mergeQuizDocuments(asts);
}

export type CompileInput =
  | { kind: 'yaml'; content: string; source?: string }
  | { kind: 'file'; path: string; content: string }
  | { kind: 'directory'; files: ComposeFileInput[] };

/**
 * Unified compiler entry: YAML string, single file, or directory of compose/module files.
 */
export function compile(input: CompileInput): QuizAst {
  switch (input.kind) {
    case 'yaml':
      return compileComposeYaml(input.content, { source: input.source });
    case 'file': {
      if (!isComposeFilename(input.path)) {
        throw new ComposeResolutionError(
          `Unsupported compose filename "${input.path}". Expected qmark-compose.yml or *.qmc.yml`,
        );
      }
      return compileComposeYaml(input.content, { source: input.path });
    }
    case 'directory':
      return compileComposeDirectory(input.files);
    default: {
      const _exhaustive: never = input;
      throw new Error(`Unknown compile input: ${JSON.stringify(_exhaustive)}`);
    }
  }
}
