import type { QuizAst } from '../ast/types';
import {
  compileComposeYaml,
  type CompileOptions,
} from '../compile/compile';

/**
 * Free-tier entry for Next.js / React apps: raw `<quiz-name>.qmc.yml` or `qmark-compose.yml` string → AST.
 */
export function parseQuizFromYaml(
  yaml: string,
  options: CompileOptions = {},
): QuizAst {
  return compileComposeYaml(yaml, options);
}
