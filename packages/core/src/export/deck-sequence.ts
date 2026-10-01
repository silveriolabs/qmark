import type { QuestionAst, QuizAst, SectionAst } from '../ast/types';

export type DeckFrame =
  | { kind: 'section-intro'; section: SectionAst }
  | { kind: 'question'; section: SectionAst; question: QuestionAst }
  | { kind: 'answer'; section: SectionAst; question: QuestionAst };

/** Canonical slide/page order for HTML, SVG, PDF, and future exporters. */
export function* iterateDeckFrames(ast: QuizAst): Generator<DeckFrame> {
  for (const section of ast.sections) {
    yield { kind: 'section-intro', section };
    for (const question of section.questions) {
      yield { kind: 'question', section, question };
      yield { kind: 'answer', section, question };
    }
  }
}
