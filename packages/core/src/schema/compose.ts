import { z } from 'zod';
import { isSupportedPhotoUrl } from '../photo/resolve-photo-url';

export const PHOTO_ANCHORS = [
  'left',
  'right',
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
  'center',
] as const;

export const QUESTION_TYPES = [
  'multiple-choice',
  'multiple-select',
  'boolean',
  'fill-blank',
  'short-answer',
  'matching',
  'ordering',
] as const;

const photoAnchorSchema = z.enum(PHOTO_ANCHORS);

const difficultySchema = z.enum(['easy', 'medium', 'hard']);

const textAnswerSchema = z.union([
  z.string().min(1),
  z.array(z.string().min(1)).min(1),
]);

const sharedQuestionFields = {
  question: z.string().min(1),
  theme: z.string().optional(),
  difficulty: difficultySchema.optional(),
  photo: z
    .string()
    .min(1)
    .refine(isSupportedPhotoUrl, {
      message: 'photo must be an http://, https://, or s3://bucket/key URL',
    })
    .optional(),
  photo_anchor: photoAnchorSchema.optional(),
};

const multipleChoiceShape = z.object({
  ...sharedQuestionFields,
  type: z.literal('multiple-choice'),
  options: z.array(z.string()).min(1),
  answer: z.string(),
});

const multipleSelectShape = z.object({
  ...sharedQuestionFields,
  type: z.literal('multiple-select'),
  options: z.array(z.string()).min(1),
  answer: z.array(z.string()).min(1),
});

const booleanShape = z.object({
  ...sharedQuestionFields,
  type: z.literal('boolean'),
  answer: z.boolean(),
});

const fillBlankShape = z.object({
  ...sharedQuestionFields,
  type: z.literal('fill-blank'),
  answer: textAnswerSchema,
});

const shortAnswerShape = z.object({
  ...sharedQuestionFields,
  type: z.literal('short-answer'),
  answer: textAnswerSchema,
});

const matchingShape = z.object({
  ...sharedQuestionFields,
  type: z.literal('matching'),
  left: z.array(z.string()).min(1),
  right: z.array(z.string()).min(1),
  answer: z.record(z.string(), z.string()),
});

const orderingShape = z.object({
  ...sharedQuestionFields,
  type: z.literal('ordering'),
  options: z.array(z.string()).min(1),
  answer: z.array(z.string()).min(1),
});

/** Allowed keys per question type (used by lint to flag unknown keys). */
export const QUESTION_KEYS: Record<(typeof QUESTION_TYPES)[number], readonly string[]> = {
  'multiple-choice': Object.keys(multipleChoiceShape.shape),
  'multiple-select': Object.keys(multipleSelectShape.shape),
  boolean: Object.keys(booleanShape.shape),
  'fill-blank': Object.keys(fillBlankShape.shape),
  'short-answer': Object.keys(shortAnswerShape.shape),
  matching: Object.keys(matchingShape.shape),
  ordering: Object.keys(orderingShape.shape),
};

type QuestionShape = z.infer<
  | typeof multipleChoiceShape
  | typeof multipleSelectShape
  | typeof booleanShape
  | typeof fillBlankShape
  | typeof shortAnswerShape
  | typeof matchingShape
  | typeof orderingShape
>;

function issue(ctx: z.RefinementCtx, path: (string | number)[], message: string): void {
  ctx.addIssue({ code: z.ZodIssueCode.custom, message, path });
}

function refineQuestion(data: QuestionShape, ctx: z.RefinementCtx): void {
  if (data.photo_anchor && !data.photo) {
    issue(ctx, ['photo_anchor'], 'photo_anchor requires photo');
  }

  switch (data.type) {
    case 'multiple-choice':
      if (!data.options.includes(data.answer)) {
        issue(ctx, ['answer'], 'answer must be one of options');
      }
      break;
    case 'multiple-select':
      for (const [index, entry] of data.answer.entries()) {
        if (!data.options.includes(entry)) {
          issue(ctx, ['answer', index], `answer[${index}] must appear in options`);
        }
      }
      break;
    case 'fill-blank':
      if (!data.question.includes('____')) {
        issue(ctx, ['question'], 'fill-blank question must contain ____');
      }
      break;
    case 'matching':
      if (data.left.length !== data.right.length) {
        issue(ctx, ['right'], 'left and right must have the same length');
      }
      for (const [key, value] of Object.entries(data.answer)) {
        if (!data.left.includes(key)) {
          issue(ctx, ['answer', key], `answer key "${key}" is not in left`);
        }
        if (!data.right.includes(value)) {
          issue(ctx, ['answer', key], `answer value "${value}" is not in right`);
        }
      }
      break;
    case 'ordering': {
      const optionSet = new Set(data.options);
      if (optionSet.size !== data.options.length) {
        issue(ctx, ['options'], 'options must not contain duplicates');
      }
      if (new Set(data.answer).size !== data.answer.length) {
        issue(ctx, ['answer'], 'answer must not contain duplicates');
      }
      if (data.options.length !== data.answer.length) {
        issue(ctx, ['answer'], 'answer must contain the same items as options');
        return;
      }
      for (const [index, item] of data.answer.entries()) {
        if (!optionSet.has(item)) {
          issue(ctx, ['answer', index], `answer item "${item}" is not in options`);
        }
      }
      break;
    }
    default:
      break;
  }
}

export const questionSchema = z
  .discriminatedUnion('type', [
    multipleChoiceShape,
    multipleSelectShape,
    booleanShape,
    fillBlankShape,
    shortAnswerShape,
    matchingShape,
    orderingShape,
  ])
  .superRefine(refineQuestion);

export const sectionSchema = z.object({
  sectionType: z.string().min(1),
  goal: z.string().min(1),
  instructions: z.string().min(1),
  questions: z.array(questionSchema).min(1),
});

export const composeDocumentSchema = z.object({
  version: z.string().min(1),
  name: z.string().min(1),
  sections: z.array(sectionSchema).min(1),
});

export const SECTION_KEYS: readonly string[] = Object.keys(sectionSchema.shape);
export const DOCUMENT_KEYS: readonly string[] = Object.keys(composeDocumentSchema.shape);

export type ComposeDocument = z.infer<typeof composeDocumentSchema>;
export type ComposeQuestion = z.infer<typeof questionSchema>;
export type ComposeSection = z.infer<typeof sectionSchema>;
