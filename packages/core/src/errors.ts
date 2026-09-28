export class QMarkError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'QMarkError';
    this.code = code;
  }
}

export class ComposeValidationError extends QMarkError {
  readonly issues: ComposeIssue[];

  constructor(message: string, issues: ComposeIssue[] = []) {
    super('COMPOSE_VALIDATION', message);
    this.name = 'ComposeValidationError';
    this.issues = issues;
  }
}

export class ComposeResolutionError extends QMarkError {
  constructor(message: string) {
    super('COMPOSE_RESOLUTION', message);
    this.name = 'ComposeResolutionError';
  }
}

export interface ComposeIssue {
  path: string;
  message: string;
}
