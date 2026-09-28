import type { QuestionAst } from '../ast/types';

/** One display line per answer entry, suitable for an answer slide. */
export function formatAnswerLines(question: QuestionAst): string[] {
  switch (question.type) {
    case 'multiple-choice':
    case 'fill-blank':
    case 'short-answer':
      return Array.isArray(question.answer) ? [...question.answer] : [question.answer];
    case 'boolean':
      return [question.answer ? 'true' : 'false'];
    case 'multiple-select':
    case 'ordering':
      return [...question.answer];
    case 'matching':
      return question.left.map((item) => `${item}: ${question.answer[item] ?? ''}`);
    default: {
      const _exhaustive: never = question;
      return [_exhaustive];
    }
  }
}
