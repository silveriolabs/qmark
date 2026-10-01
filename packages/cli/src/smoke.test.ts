import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileComposeDirectory } from '@silverio-labs/qmark-core';
import { loadCompileInput } from './load-input';

const repoRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..');
const samplesDir = resolve(repoRoot, '_quiz_samples');

const files = loadCompileInput(samplesDir);
assert.ok(files.length >= 1);

const ast = compileComposeDirectory(files);
assert.equal(ast.name, 'Quiz 1 + Simple Medical Quiz + Simple Science Quiz');
assert.ok(ast.sections.length >= 1);
assert.ok(ast.sources?.includes('qmark-compose.yml'));
assert.ok(ast.sources?.includes('1-medical-quiz.qmc.yml'));
assert.ok(ast.sources?.includes('2-science-quiz.qmc.yml'));

console.log('cli smoke tests passed');
