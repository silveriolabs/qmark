import { ComposeResolutionError } from '../errors';

/** Logical file passed into the compiler (browser-safe; no filesystem). */
export interface ComposeFileInput {
  /** Path relative to the quiz directory, e.g. `qmark-compose.yml` or `intro.qmc.yml`. */
  path: string;
  content: string;
}

export const COMPOSE_BASENAMES = [
  'qmark-compose.yml',
  'qmark-compose.yaml',
] as const;

const QMC_MODULE_PATTERN = /\.qmc\.ya?ml$/i;

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\.\/+/, '');
}

function basename(path: string): string {
  const normalized = normalizePath(path);
  const parts = normalized.split('/');
  return parts[parts.length - 1] ?? normalized;
}

export type ComposeResolutionMode =
  | 'single-compose'
  | 'multi-module'
  | 'compose-and-modules';

export interface ResolvedComposeSources {
  mode: ComposeResolutionMode;
  files: ComposeFileInput[];
}

/**
 * Resolve a directory of compose/module YAML files to the set that should be compiled.
 *
 * Scans for `qmark-compose.yml` / `.yaml` and all `*.qmc.yml` / `*.qmc.yaml` files.
 * When both exist, the compose file is merged first, then modules in path order.
 */
export function resolveComposeDirectory(
  files: ComposeFileInput[],
): ResolvedComposeSources {
  if (files.length === 0) {
    throw new ComposeResolutionError(
      'Directory must contain qmark-compose.yml and/or one or more *.qmc.yml files',
    );
  }

  const normalized = files.map((file) => ({
    ...file,
    path: normalizePath(file.path),
  }));

  const composeMatches = normalized.filter((file) =>
    COMPOSE_BASENAMES.includes(
      basename(file.path) as (typeof COMPOSE_BASENAMES)[number],
    ),
  );

  if (composeMatches.length > 1) {
    throw new ComposeResolutionError(
      'Directory must contain at most one qmark-compose.yml / qmark-compose.yaml file',
    );
  }

  const modules = normalized
    .filter((file) => QMC_MODULE_PATTERN.test(basename(file.path)))
    .sort((a, b) => a.path.localeCompare(b.path));

  const compose = composeMatches[0];
  const resolved: ComposeFileInput[] = [
    ...(compose ? [compose] : []),
    ...modules,
  ];

  if (resolved.length === 0) {
    throw new ComposeResolutionError(
      'Directory must contain qmark-compose.yml and/or one or more *.qmc.yml module files',
    );
  }

  let mode: ComposeResolutionMode;
  if (compose && modules.length > 0) {
    mode = 'compose-and-modules';
  } else if (compose) {
    mode = 'single-compose';
  } else {
    mode = 'multi-module';
  }

  return { mode, files: resolved };
}

export function isComposeFilename(path: string): boolean {
  const base = basename(path);
  return (
    (COMPOSE_BASENAMES as readonly string[]).includes(base) ||
    QMC_MODULE_PATTERN.test(base)
  );
}

export function isQmcModuleFilename(path: string): boolean {
  return QMC_MODULE_PATTERN.test(basename(path));
}
