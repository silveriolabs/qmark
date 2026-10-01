import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  compile,
  compileComposeYaml,
  parseQuizFromYaml,
  requireFeature,
  renderHtmlSlideDeck,
  renderSvgSlideDeck,
  resolveComposeDirectory,
  WATERMARK,
} from '../index';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '../../../..');
const exampleYaml = readFileSync(
  join(root, '_quiz_samples/qmark-compose.yml'),
  'utf8',
);

const ast = compileComposeYaml(exampleYaml, { source: 'qmark-compose.yml' });
assert.equal(ast.name, 'Quiz 1');
assert.equal(ast.sections.length, 7);

assert.equal(parseQuizFromYaml(exampleYaml).name, 'Quiz 1');

const single = resolveComposeDirectory([
  { path: 'qmark-compose.yml', content: exampleYaml },
]);
assert.equal(single.mode, 'single-compose');

const moduleA = `version: 1.0.0
name: Module A
sections:
  - sectionType: Warmup
    instructions: Pick one.
    goal: Basics
    questions:
      - question: Two plus two?
        type: multiple-choice
        options: ["3", "4", "5"]
        answer: "4"
`;

const moduleB = `version: 1.0.0
name: Module B
sections:
  - sectionType: Review
    instructions: True or false.
    goal: Check
    questions:
      - question: The sky is blue.
        type: boolean
        answer: true
`;

const multi = resolveComposeDirectory([
  { path: 'b-part.qmc.yml', content: moduleB },
  { path: 'a-part.qmc.yml', content: moduleA },
]);
assert.equal(multi.mode, 'multi-module');

const combined = resolveComposeDirectory([
  { path: 'qmark-compose.yml', content: exampleYaml },
  { path: 'extra.qmc.yml', content: moduleA },
]);
assert.equal(combined.mode, 'compose-and-modules');
assert.equal(combined.files.length, 2);
assert.equal(combined.files[0]?.path, 'qmark-compose.yml');

const mergedDir = compile({
  kind: 'directory',
  files: combined.files,
});
assert.equal(mergedDir.sections.length, 8);

let paidBlocked = false;
try {
  requireFeature('free', 'pptx-export');
} catch {
  paidBlocked = true;
}
assert.equal(paidBlocked, true);

const freeHtml = renderHtmlSlideDeck(ast, { tier: 'free' });
assert.ok(freeHtml.includes(WATERMARK.before));
const proHtml = renderHtmlSlideDeck(ast, { tier: 'pro' });
assert.ok(!proHtml.includes('class="watermark"'));

const freeSvg = renderSvgSlideDeck(ast, { tier: 'free' });
assert.ok(freeSvg.includes(WATERMARK.before));
const proSvg = renderSvgSlideDeck(ast, { tier: 'pro' });
assert.ok(!proSvg.includes(WATERMARK.before));

console.log('compile tests passed');
