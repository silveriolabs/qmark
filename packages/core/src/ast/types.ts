export type QuestionType =
  | 'multiple-choice'
  | 'multiple-select'
  | 'boolean'
  | 'fill-blank'
  | 'short-answer'
  | 'matching'
  | 'ordering';

export type PhotoAnchor =
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'center';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface QuizAst {
  version: string;
  name: string;
  sections: SectionAst[];
  /** Present when compiled from multiple module files. */
  sources?: string[];
}

export interface SectionAst {
  id: string;
  sectionType: string;
  goal: string;
  instructions: string;
  questions: QuestionAst[];
  /** Source filename when merged from a directory of modules. */
  source?: string;
}

export type QuestionAst =
  | MultipleChoiceQuestion
  | MultipleSelectQuestion
  | BooleanQuestion
  | FillBlankQuestion
  | ShortAnswerQuestion
  | MatchingQuestion
  | OrderingQuestion;

interface QuestionBase {
  id: string;
  question: string;
  type: QuestionType;
  theme?: string;
  difficulty?: Difficulty;
  photo?: string;
  photoAnchor?: PhotoAnchor;
}

export interface MultipleChoiceQuestion extends QuestionBase {
  type: 'multiple-choice';
  options: string[];
  answer: string;
}

export interface MultipleSelectQuestion extends QuestionBase {
  type: 'multiple-select';
  options: string[];
  answer: string[];
}

export interface BooleanQuestion extends QuestionBase {
  type: 'boolean';
  answer: boolean;
}

export interface FillBlankQuestion extends QuestionBase {
  type: 'fill-blank';
  answer: string | string[];
}

export interface ShortAnswerQuestion extends QuestionBase {
  type: 'short-answer';
  answer: string | string[];
}

export interface MatchingQuestion extends QuestionBase {
  type: 'matching';
  left: string[];
  right: string[];
  answer: Record<string, string>;
}

export interface OrderingQuestion extends QuestionBase {
  type: 'ordering';
  options: string[];
  answer: string[];
}
