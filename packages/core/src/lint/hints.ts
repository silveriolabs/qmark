import type { ZodIssue } from 'zod';
import { PHOTO_ANCHORS, QUESTION_TYPES } from '../schema/compose';

const DIFFICULTIES = ['easy', 'medium', 'hard'];

function lastKey(path: readonly (string | number)[]): string | undefined {
  for (let i = path.length - 1; i >= 0; i--) {
    if (typeof path[i] === 'string') return path[i] as string;
  }
  return undefined;
}

/** Maps a Zod issue to a stable diagnostic code. */
export function codeForIssue(issue: ZodIssue): string {
  switch (issue.code) {
    case 'invalid_type':
      return issue.received === 'undefined' ? 'missing-key' : 'invalid-type';
    case 'invalid_enum_value':
      return 'invalid-enum';
    case 'invalid_union_discriminator':
      return 'invalid-question-type';
    case 'too_small':
      return 'too-small';
    case 'invalid_union':
      return 'invalid-value';
    case 'custom':
      return 'rule';
    default:
      return issue.code.replace(/_/g, '-');
  }
}

/** Builds a readable message, replacing Zod's terse defaults where they are unhelpful. */
export function messageForIssue(issue: ZodIssue): string {
  const key = lastKey(issue.path);
  if (issue.code === 'invalid_type' && issue.received === 'undefined') {
    return `missing required key "${key}"`;
  }
  if (issue.code === 'invalid_enum_value') {
    return `invalid ${key} "${String(issue.received)}"`;
  }
  if (issue.code === 'invalid_union_discriminator') {
    return 'missing or unknown question type';
  }
  return issue.message;
}

/** Short "how to fix" suggestion for a Zod issue, when one is obvious. */
export function hintForIssue(issue: ZodIssue): string | undefined {
  const key = lastKey(issue.path);

  if (issue.code === 'invalid_enum_value') {
    return `use one of ${issue.options.join(', ')}`;
  }
  if (issue.code === 'invalid_union_discriminator') {
    return `set type to one of ${QUESTION_TYPES.join(', ')}`;
  }
  if (issue.code === 'invalid_type') {
    if (key === 'version' && issue.received === 'number') {
      return 'quote it, e.g. version: "1.0.0"';
    }
    if (issue.received === 'undefined') {
      return `add "${key}:" to this item`;
    }
    if (key === 'answer' && issue.expected === 'boolean') {
      return 'use unquoted true or false';
    }
    if (issue.expected === 'string' && (issue.received === 'number' || issue.received === 'boolean')) {
      return 'quote the value so YAML keeps it as text';
    }
    if (issue.expected === 'array') {
      return `write ${key} as a list (- item per line)`;
    }
  }
  if (issue.code === 'too_small' && issue.type === 'array') {
    return `add at least ${issue.minimum} item(s) to ${key}`;
  }
  if (issue.code === 'too_small' && issue.type === 'string') {
    return `${key} must not be empty`;
  }

  const message = issue.message;
  if (message === 'photo_anchor requires photo') {
    return 'add a photo URL or remove photo_anchor';
  }
  if (message.startsWith('photo must be')) {
    return 'use https://…, http://…, or s3://bucket/key';
  }
  if (message === 'fill-blank question must contain ____') {
    return 'put four underscores (____) where the blank goes';
  }
  if (message === 'answer must be one of options' || message.includes('must appear in options')) {
    return 'make the answer text exactly match one of options (case and spacing)';
  }
  if (message.includes('is not in left') || message.includes('is not in right')) {
    return 'answer keys must match left items; values must match right items exactly';
  }
  if (message === 'left and right must have the same length') {
    return 'add or remove items so left and right have the same count';
  }
  if (message === 'answer must contain the same items as options' || message.includes('is not in options')) {
    return 'answer must be a reordering of exactly the items in options';
  }
  if (key === 'photo_anchor') {
    return `use one of ${PHOTO_ANCHORS.join(', ')}`;
  }
  if (key === 'difficulty') {
    return `use one of ${DIFFICULTIES.join(', ')}`;
  }
  return undefined;
}
