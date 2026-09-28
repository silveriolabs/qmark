export type {
  Difficulty,
  PhotoAnchor,
  QuestionAst,
  QuestionType,
  QuizAst,
  SectionAst,
} from './ast/types';

export { mergeQuizDocuments, normalizeDocument } from './ast/normalize';
export type { NormalizeOptions } from './ast/normalize';

export {
  ComposeResolutionError,
  ComposeValidationError,
  QMarkError,
} from './errors';
export type { ComposeIssue } from './errors';

export { parseComposeYaml } from './parse/parse-yaml';
export { parseQuizFromYaml } from './parse/quiz-from-yaml';

export { renderHtmlSlideDeck } from './export/html-slides';

export {
  isFeatureAvailable,
  PaidFeatureError,
  requireFeature,
  TIER_MATRIX,
} from './tier/features';
export type { QMarkFeature, QMarkTier } from './tier/features';

export {
  composeDocumentSchema,
  questionSchema,
  sectionSchema,
} from './schema/compose';
export type {
  ComposeDocument,
  ComposeQuestion,
  ComposeSection,
} from './schema/compose';

export {
  COMPOSE_BASENAMES,
  isComposeFilename,
  isQmcModuleFilename,
  resolveComposeDirectory,
} from './compile/resolve-input';
export type {
  ComposeFileInput,
  ComposeResolutionMode,
  ResolvedComposeSources,
} from './compile/resolve-input';

export {
  compile,
  compileComposeDirectory,
  compileComposeFiles,
  compileComposeYaml,
} from './compile/compile';
export type { CompileInput, CompileOptions } from './compile/compile';
