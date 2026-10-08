import { createRequire } from 'node:module';
import { mkdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import {
  compileComposeDirectory,
  compileComposeYaml,
  ComposeValidationError,
  lintComposeFiles,
  requireFeature,
  renderHtmlSlideDeck,
  renderSvgSlideDeck,
  type ComposeFileInput,
} from '@silverio-labs/qmark-core';
import { writeQuizPdf } from './export-pdf';
import { photoDataUri, prefetchPhotos } from './fetch-photos';
import {
  displayPathResolver,
  formatDiagnosticsJson,
  formatDiagnosticsText,
} from './format-diagnostics';
import { loadCompileInput } from './load-input';

declare const __filename: string;

const require = createRequire(__filename);
const { version } = require('../package.json') as { version: string };

const LOGO = `
 ####  #   #   #   ####  #  #
#    # ## ##  # #  #   # # #
#  # # # # # ##### ####  ##
#   ## #   # #   # # #   # #
 ####  #   # #   # #  #  #  #
`;

const USAGE = `qmark compile <file-or-directory> [options]
qmark lint <file-or-directory> [--format text|json]

Lint:
  Validates *.qmc.yml and optional qmark-compose.yml; prints file:line:col with a fix hint.
  Exits 1 on errors, 0 when there are only warnings.

Compile options:
  --pdf           Export vector PDF (free)
  --html          Export static HTML slide deck (free)
  --svg           Export vector SVG slide deck (free)
  -o, --output    Output file path (default: ./qmark-out/quiz.pdf, .html, or .svg)
  --pptx          Export editable PPTX (Pro / Enterprise)
  --tier          License tier: free | pro | enterprise (default: free)
  -v, --version   Print version
  -h, --help      Show help
`;

function parseArgs(argv: string[]) {
  const positional: string[] = [];
  let pdf = false;
  let html = false;
  let svg = false;
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
    if (arg === '--svg') {
      svg = true;
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

  return { help: false as const, positional, pdf, html, svg, pptx, output, tier };
}

async function runCompile(args: ReturnType<typeof parseArgs> & { help: false }) {
  const target = args.positional[0];
  if (!target) {
    throw new Error('Missing path to a .qmc.yml file, qmark-compose.yml, or quiz directory');
  }

  if (!args.pdf && !args.html && !args.svg && !args.pptx) {
    throw new Error('Specify at least one export flag: --pdf, --html, --svg, or --pptx');
  }

  const absolute = resolve(target);
  const { files, isDirectory } = loadAndLint(absolute, 'text');
  const ast = isDirectory
    ? compileComposeDirectory(files)
    : compileComposeYaml(files[0]!.content, { source: files[0]!.path });

  const outDir = join(process.cwd(), 'qmark-out');
  mkdirSync(outDir, { recursive: true });

  const photoBaseDir = isDirectory ? absolute : dirname(absolute);
  const photos =
    args.pdf || args.svg || args.html
      ? await prefetchPhotos(ast, { baseDir: photoBaseDir })
      : undefined;

  if (args.pdf) {
    requireFeature(args.tier, 'pdf-export');
    const out = args.output ?? join(outDir, `${slugify(ast.name)}.pdf`);
    mkdirSync(dirname(out), { recursive: true });
    await writeQuizPdf(ast, out, { tier: args.tier, photos });
    console.log(`Wrote ${out}`);
  }

  if (args.html) {
    requireFeature(args.tier, 'html-slides');
    const out =
      args.output && !args.pdf ? args.output : join(outDir, `${slugify(ast.name)}.html`);
    mkdirSync(dirname(out), { recursive: true });
    const htmlPhotos = new Map<string, string>();
    for (const [key, buf] of photos ?? []) {
      htmlPhotos.set(key, photoDataUri(buf));
    }
    writeFileSync(
      out,
      renderHtmlSlideDeck(ast, { tier: args.tier, photos: htmlPhotos }),
      'utf8',
    );
    console.log(`Wrote ${out}`);
  }

  if (args.svg) {
    requireFeature(args.tier, 'svg-export');
    const out =
      args.output && !args.pdf && !args.html
        ? args.output
        : join(outDir, `${slugify(ast.name)}.svg`);
    mkdirSync(dirname(out), { recursive: true });
    const svgPhotos = new Map<string, string>();
    for (const [url, buf] of photos ?? []) {
      svgPhotos.set(url, photoDataUri(buf));
    }
    writeFileSync(out, renderSvgSlideDeck(ast, { tier: args.tier, photos: svgPhotos }), 'utf8');
    console.log(`Wrote ${out}`);
  }

  if (args.pptx) {
    requireFeature(args.tier, 'pptx-export');
    throw new Error('PPTX export is licensed on Pro but not shipped in this CLI release yet.');
  }
}

/** Loads input files and lints them; prints diagnostics and throws {@link ComposeValidationError} on errors. */
function loadAndLint(
  absolute: string,
  format: 'text' | 'json',
  printClean = false,
): { files: ComposeFileInput[]; isDirectory: boolean } {
  const files = loadCompileInput(absolute);
  const isDirectory = statSync(absolute).isDirectory();
  const displayPath = displayPathResolver(isDirectory ? absolute : dirname(absolute));
  const result = lintComposeFiles(files);

  if (format === 'json') {
    console.log(formatDiagnosticsJson(result.diagnostics, displayPath));
  } else if (result.diagnostics.length > 0) {
    const text = formatDiagnosticsText(result.diagnostics, files, displayPath);
    (result.ok ? console.warn : console.error)(text);
  } else if (printClean) {
    console.log(`No problems found in ${files.length} file(s).`);
  }

  if (!result.ok) {
    const errors = result.diagnostics.filter((d) => d.severity === 'error');
    const source = errors[0]?.source ?? files[0]?.path ?? 'compose';
    const syntaxError = errors.some((d) => d.code.startsWith('yaml-'));
    throw new ComposeValidationError(
      syntaxError ? `Invalid YAML in ${source}` : `Compose validation failed for ${source}`,
      errors.map((d) => ({
        path: d.path,
        message: d.message,
        line: d.line,
        column: d.column,
        ...(d.hint ? { hint: d.hint } : {}),
      })),
    );
  }
  return { files, isDirectory };
}

function runLint(argv: string[]) {
  let format: 'text' | 'json' = 'text';
  const positional: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === '-h' || arg === '--help') {
      console.log(`${LOGO}\n${USAGE}`);
      return;
    }
    if (arg === '--format') {
      const next = argv[++i];
      if (next !== 'text' && next !== 'json') {
        throw new Error('--format must be text or json');
      }
      format = next;
      continue;
    }
    if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    }
    positional.push(arg);
  }

  const target = positional[0];
  if (!target) {
    throw new Error('Missing path to a .qmc.yml file, qmark-compose.yml, or quiz directory');
  }
  loadAndLint(resolve(target), format, true);
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
    console.log(`${LOGO}\n${version}`);
    process.exit(0);
  }

  if (!command || command === '-h' || command === '--help') {
    console.log(`${LOGO}\n${USAGE}`);
    process.exit(0);
  }

  if (command !== 'compile' && command !== 'lint') {
    console.error(`Unknown command: ${command}\n\n${USAGE}`);
    process.exit(1);
  }

  try {
    if (command === 'lint') {
      runLint(rest);
      return;
    }
    const args = parseArgs(rest);
    if ('version' in args) {
      console.log(`${LOGO}\n${version}`);
      process.exit(0);
    }
    if (args.help) {
      console.log(`${LOGO}\n${USAGE}`);
      process.exit(0);
    }
    await runCompile(args);
  } catch (error) {
    if (error instanceof ComposeValidationError) {
      console.error(`${error.code}: ${error.message}`);
    } else {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${message}`);
    }
    process.exit(1);
  }
}

void main();
