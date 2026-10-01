import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { ComposeFileInput } from '@silverio-labs/qmark-core';
import {
  COMPOSE_BASENAMES,
  isComposeFilename,
} from '@silverio-labs/qmark-core';

function isQmcModule(name: string): boolean {
  return /\.qmc\.ya?ml$/i.test(name);
}

function readComposeFile(absolutePath: string, root: string): ComposeFileInput {
  const relative = absolutePath.startsWith(root)
    ? absolutePath.slice(root.length).replace(/^[/\\]/, '')
    : absolutePath;
  return {
    path: relative.replace(/\\/g, '/'),
    content: readFileSync(absolutePath, 'utf8'),
  };
}

/** Load a single compose/module file or every compose + `*.qmc.yml` in a directory. */
export function loadCompileInput(targetPath: string): ComposeFileInput[] {
  const stat = statSync(targetPath);
  if (stat.isFile()) {
    if (!isComposeFilename(targetPath)) {
      throw new Error(
        `Unsupported file "${targetPath}". Use a .qmc.yml file or qmark-compose.yml`,
      );
    }
    return [readComposeFile(targetPath, join(targetPath, '..'))];
  }

  if (!stat.isDirectory()) {
    throw new Error(`Not a file or directory: ${targetPath}`);
  }

  const names = readdirSync(targetPath);
  const picked: ComposeFileInput[] = [];

  for (const base of COMPOSE_BASENAMES) {
    if (names.includes(base)) {
      picked.push(readComposeFile(join(targetPath, base), targetPath));
      break;
    }
  }

  for (const name of names.filter(isQmcModule).sort()) {
    picked.push(readComposeFile(join(targetPath, name), targetPath));
  }

  if (picked.length === 0) {
    throw new Error(
      `No .qmc.yml or qmark-compose.yml files found in ${targetPath}`,
    );
  }

  return picked;
}
