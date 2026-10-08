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

export { formatAnswerLines } from './export/format-answer';
export { iterateDeckFrames } from './export/deck-sequence';
export type { DeckFrame } from './export/deck-sequence';
export { renderHtmlSlideDeck } from './export/html-slides';
export type { RenderHtmlSlideDeckOptions } from './export/html-slides';
export { renderSvgSlideDeck } from './export/svg-slides';
export type { RenderSvgSlideDeckOptions } from './export/svg-slides';

export { WATERMARK, WATERMARK_TEXT, watermarkHtml } from './watermark/watermark';

export {
  DEFAULT_PHOTO_ANCHOR,
  isLocalPhotoPath,
  isSupportedPhotoUrl,
  photoLookupKey,
  resolvePhotoUrl,
} from './photo/resolve-photo-url';

export {
  isFeatureAvailable,
  PaidFeatureError,
  requireFeature,
  shouldWatermarkExport,
  TIER_MATRIX,
} from './tier/features';
export type { QMarkFeature, QMarkTier } from './tier/features';

export {
  composeDocumentSchema,
  PHOTO_ANCHORS,
  QUESTION_TYPES,
  questionSchema,
  sectionSchema,
} from './schema/compose';

export { analyzeComposeYaml, lintComposeFiles, lintComposeYaml } from './lint';
export type {
  ComposeAnalysis,
  LintDiagnostic,
  LintOptions,
  LintResult,
  LintSeverity,
} from './lint';
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
