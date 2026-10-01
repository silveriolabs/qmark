import type {
  ComposeDocument,
  ComposeQuestion,
  ComposeSection,
} from '../schema/compose';
import type {
  QuestionAst,
  QuizAst,
  SectionAst,
} from './types';
import { resolvePhotoUrl } from '../photo/resolve-photo-url';

export interface NormalizeOptions {
  /** Basename or logical id of the source file (for multi-module merges). */
  source?: string;
  /** When merging modules, prefix section ids to keep them stable and unique. */
  sourceIndex?: number;
}

function normalizeQuestion(
  question: ComposeQuestion,
  sectionId: string,
  questionIndex: number,
): QuestionAst {
  const id = `${sectionId}-q${questionIndex + 1}`;
  const base = {
    id,
    question: question.question,
    type: question.type,
    ...(question.theme !== undefined ? { theme: question.theme } : {}),
    ...(question.difficulty !== undefined ? { difficulty: question.difficulty } : {}),
    ...(question.photo !== undefined
      ? { photo: resolvePhotoUrl(question.photo) ?? question.photo }
      : {}),
    ...(question.photo_anchor !== undefined
      ? { photoAnchor: question.photo_anchor }
      : {}),
  };

  switch (question.type) {
    case 'multiple-choice':
      return { ...base, type: 'multiple-choice', options: [...question.options], answer: question.answer };
    case 'multiple-select':
      return { ...base, type: 'multiple-select', options: [...question.options], answer: [...question.answer] };
    case 'boolean':
      return { ...base, type: 'boolean', answer: question.answer };
    case 'fill-blank':
      return {
        ...base,
        type: 'fill-blank',
        answer: Array.isArray(question.answer) ? [...question.answer] : question.answer,
      };
    case 'short-answer':
      return {
        ...base,
        type: 'short-answer',
        answer: Array.isArray(question.answer) ? [...question.answer] : question.answer,
      };
    case 'matching':
      return {
        ...base,
        type: 'matching',
        left: [...question.left],
        right: [...question.right],
        answer: { ...question.answer },
      };
    case 'ordering':
      return {
        ...base,
        type: 'ordering',
        options: [...question.options],
        answer: [...question.answer],
      };
    default: {
      const _exhaustive: never = question;
      throw new Error(`Unsupported question type: ${(_exhaustive as ComposeQuestion).type}`);
    }
  }
}

function normalizeSection(
  section: ComposeSection,
  sectionIndex: number,
  options: NormalizeOptions,
): SectionAst {
  const prefix =
    options.sourceIndex !== undefined
      ? `s${options.sourceIndex + 1}`
      : 's';
  const id = `${prefix}-${sectionIndex + 1}`;
  return {
    id,
    sectionType: section.sectionType,
    instructions: section.instructions,
    goal: section.goal,
    ...(options.source !== undefined ? { source: options.source } : {}),
    questions: section.questions.map((q, qi) => normalizeQuestion(q, id, qi)),
  };
}

export function normalizeDocument(
  document: ComposeDocument,
  options: NormalizeOptions = {},
): QuizAst {
  return {
    version: document.version,
    name: document.name,
    sections: document.sections.map((section, index) =>
      normalizeSection(section, index, options),
    ),
    ...(options.source !== undefined ? { sources: [options.source] } : {}),
  };
}

export function mergeQuizDocuments(documents: QuizAst[]): QuizAst {
  if (documents.length === 0) {
    throw new Error('mergeQuizDocuments requires at least one document');
  }
  const sections = documents.flatMap((doc) => doc.sections);
  const sources = [
    ...new Set(documents.flatMap((doc) => doc.sources ?? [])),
  ];
  const names = [...new Set(documents.map((doc) => doc.name))];
  const name = names.length === 1 ? names[0]! : names.join(' + ');
  return {
    version: documents[0]!.version,
    name,
    sections,
    ...(sources.length > 0 ? { sources } : {}),
  };
}
