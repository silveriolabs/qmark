import { z } from 'zod';

const photoAnchorSchema = z.enum([
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
  'center',
]);

const difficultySchema = z.enum(['easy', 'medium', 'hard']);

const questionTypeSchema = z.enum([
  'multiple-choice',
  'multiple-select',
  'boolean',
  'fill-blank',
  'short-answer',
  'matching',
  'ordering',
]);

const photoFields = {
  photo: z.string().min(1).optional(),
  photo_anchor: photoAnchorSchema.optional(),
};

const sharedQuestionFields = {
  question: z.string().min(1),
  theme: z.string().optional(),
  difficulty: difficultySchema.optional(),
  ...photoFields,
};

function rejectPhotoAnchorWithoutPhoto(
  data: { photo?: string; photo_anchor?: string },
  ctx: z.RefinementCtx,
  pathPrefix: (string | number)[],
): void {
  if (data.photo_anchor && !data.photo) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'photo_anchor requires photo',
      path: [...pathPrefix, 'photo_anchor'],
    });
  }
}

const multipleChoiceSchema = z
  .object({
    ...sharedQuestionFields,
    type: z.literal('multiple-choice'),
    options: z.array(z.string()).min(1),
    answer: z.string(),
  })
  .superRefine((data, ctx) => {
    rejectPhotoAnchorWithoutPhoto(data, ctx, []);
    if (!data.options.includes(data.answer)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'answer must be one of options',
        path: ['answer'],
      });
    }
  });

const multipleSelectSchema = z
  .object({
    ...sharedQuestionFields,
    type: z.literal('multiple-select'),
    options: z.array(z.string()).min(1),
    answer: z.array(z.string()).min(1),
  })
  .superRefine((data, ctx) => {
    rejectPhotoAnchorWithoutPhoto(data, ctx, []);
    for (const [index, entry] of data.answer.entries()) {
      if (!data.options.includes(entry)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `answer[${index}] must appear in options`,
          path: ['answer', index],
        });
      }
    }
  });

const booleanSchema = z
  .object({
    ...sharedQuestionFields,
    type: z.literal('boolean'),
    answer: z.boolean(),
  })
  .superRefine((data, ctx) => {
    rejectPhotoAnchorWithoutPhoto(data, ctx, []);
  });

const fillBlankSchema = z
  .object({
    ...sharedQuestionFields,
    type: z.literal('fill-blank'),
    answer: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]),
  })
  .superRefine((data, ctx) => {
    rejectPhotoAnchorWithoutPhoto(data, ctx, []);
    if (!data.question.includes('____')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'fill-blank question must contain ____',
        path: ['question'],
      });
    }
  });

const shortAnswerSchema = z
  .object({
    ...sharedQuestionFields,
    type: z.literal('short-answer'),
    answer: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]),
  })
  .superRefine((data, ctx) => {
    rejectPhotoAnchorWithoutPhoto(data, ctx, []);
  });

const matchingSchema = z
  .object({
    ...sharedQuestionFields,
    type: z.literal('matching'),
    left: z.array(z.string()).min(1),
    right: z.array(z.string()).min(1),
    answer: z.record(z.string(), z.string()),
  })
  .superRefine((data, ctx) => {
    rejectPhotoAnchorWithoutPhoto(data, ctx, []);
    if (data.left.length !== data.right.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'left and right must have the same length',
        path: ['right'],
      });
    }
    for (const [key, value] of Object.entries(data.answer)) {
      if (!data.left.includes(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `answer key "${key}" is not in left`,
          path: ['answer', key],
        });
      }
      if (!data.right.includes(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `answer value "${value}" is not in right`,
          path: ['answer', key],
        });
      }
    }
  });

const orderingSchema = z
  .object({
    ...sharedQuestionFields,
    type: z.literal('ordering'),
    options: z.array(z.string()).min(1),
    answer: z.array(z.string()).min(1),
  })
  .superRefine((data, ctx) => {
    rejectPhotoAnchorWithoutPhoto(data, ctx, []);
    const optionSet = new Set(data.options);
    const answerSet = new Set(data.answer);
    if (optionSet.size !== data.options.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'options must not contain duplicates',
        path: ['options'],
      });
    }
    if (answerSet.size !== data.answer.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'answer must not contain duplicates',
        path: ['answer'],
      });
    }
    if (data.options.length !== data.answer.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'answer must contain the same items as options',
        path: ['answer'],
      });
      return;
    }
    for (const item of data.answer) {
      if (!optionSet.has(item)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `answer item "${item}" is not in options`,
          path: ['answer'],
        });
      }
    }
  });

export const questionSchema = z.union([
  multipleChoiceSchema,
  multipleSelectSchema,
  booleanSchema,
  fillBlankSchema,
  shortAnswerSchema,
  matchingSchema,
  orderingSchema,
]);

export const sectionSchema = z.object({
  sectionType: z.string().min(1),
  instructions: z.string().min(1),
  goal: z.string().min(1),
  questions: z.array(questionSchema).min(1),
});

export const composeDocumentSchema = z.object({
  version: z.string().min(1),
  name: z.string().min(1),
  sections: z.array(sectionSchema).min(1),
});

export type ComposeDocument = z.infer<typeof composeDocumentSchema>;
export type ComposeQuestion = z.infer<typeof questionSchema>;
export type ComposeSection = z.infer<typeof sectionSchema>;
