import { createRequire } from 'node:module';
import { mkdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import {
  compileComposeDirectory,
  compileComposeYaml,
  requireFeature,
  renderHtmlSlideDeck,
} from '@silverio-labs/qmark-core';
import { writeQuizPdf } from './export-pdf';
import { loadCompileInput } from './load-input';

const require = createRequire(import.meta.url);
const { version } = require('../package.json') as { version: string };

const USAGE = `qmark compile <file-or-directory> [options]

Options:
  --pdf           Export vector PDF (free)
  --html          Export static HTML slide deck (free)
  -o, --output    Output file path (default: ./qmark-out/quiz.pdf or .html)
  --pptx          Export editable PPTX (Pro / Enterprise)
  --tier          License tier: free | pro | enterprise (default: free)
  -v, --version   Print version
  -h, --help      Show help
`;

function parseArgs(argv: string[]) {
  const positional: string[] = [];
  let pdf = false;
  let html = false;
  let pptx = false;
  let output: string | undefined;
  let tier: 'free' | 'pro' | 'enterprise' = 'free';

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === '-h' || arg === '--help') {
      return { help: true as const };
    }
    if (arg === '-v' || arg === '--version') {
      return { version: true as const };
    }
    if (arg === '--pdf') {
      pdf = true;
      continue;
    }
    if (arg === '--html') {
      html = true;
      continue;
    }
    if (arg === '--pptx') {
      pptx = true;
      continue;
    }
    if (arg === '--tier') {
      const next = argv[++i];
      if (next !== 'free' && next !== 'pro' && next !== 'enterprise') {
        throw new Error('--tier must be free, pro, or enterprise');
      }
      tier = next;
      continue;
    }
    if (arg === '-o' || arg === '--output') {
      output = argv[++i];
      continue;
    }
    if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    }
    positional.push(arg);
  }

  return { help: false as const, positional, pdf, html, pptx, output, tier };
}

async function runCompile(args: ReturnType<typeof parseArgs> & { help: false }) {
  const target = args.positional[0];
  if (!target) {
    throw new Error('Missing path to qmark-compose.yml or quiz directory');
  }

  if (!args.pdf && !args.html && !args.pptx) {
    throw new Error('Specify at least one export flag: --pdf, --html, or --pptx');
  }

  const absolute = resolve(target);
  const files = loadCompileInput(absolute);
  const isDirectory = statSync(absolute).isDirectory();
  const ast = isDirectory
    ? compileComposeDirectory(files)
    : compileComposeYaml(files[0]!.content, { source: files[0]!.path });

  const outDir = join(process.cwd(), 'qmark-out');
  mkdirSync(outDir, { recursive: true });

  if (args.pdf) {
    requireFeature(args.tier, 'pdf-export');
    const out = args.output ?? join(outDir, `${slugify(ast.name)}.pdf`);
    mkdirSync(dirname(out), { recursive: true });
    await writeQuizPdf(ast, out);
    console.log(`Wrote ${out}`);
  }

  if (args.html) {
    requireFeature(args.tier, 'html-slides');
    const out = args.output && !args.pdf ? args.output : join(outDir, `${slugify(ast.name)}.html`);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, renderHtmlSlideDeck(ast), 'utf8');
    console.log(`Wrote ${out}`);
  }

  if (args.pptx) {
    requireFeature(args.tier, 'pptx-export');
    throw new Error(
      'PPTX export is available on QMark Pro. Set --tier pro with a valid license (coming soon).',
    );
  }
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'quiz';
}

async function main() {
  const [, , command, ...rest] = process.argv;

  if (command === '-v' || command === '--version') {
    console.log(version);
    process.exit(0);
  }

  if (!command || command === '-h' || command === '--help') {
    console.log(USAGE);
    process.exit(0);
  }

  if (command !== 'compile') {
    console.error(`Unknown command: ${command}\n\n${USAGE}`);
    process.exit(1);
  }

  try {
    const args = parseArgs(rest);
    if ('version' in args) {
      console.log(version);
      process.exit(0);
    }
    if (args.help) {
      console.log(USAGE);
      process.exit(0);
    }
    await runCompile(args);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    process.exit(1);
  }
}

void main();
