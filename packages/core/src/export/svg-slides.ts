import type { QuestionAst, QuizAst, SectionAst } from '../ast/types';
import { shouldWatermarkExport, type QMarkTier } from '../tier/features';
import { WATERMARK_TEXT } from '../watermark/watermark';
import { formatAnswerLines } from './format-answer';

const SLIDE_W = 612;
const SLIDE_H = 792;
const MARGIN = 48;
const LINE = 22;

export interface RenderSvgSlideDeckOptions {
  tier?: QMarkTier;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrapText(
  text: string,
  maxWidth: number,
  fontSize: number,
  approxCharWidth = fontSize * 0.55,
): string[] {
  const maxChars = Math.max(12, Math.floor(maxWidth / approxCharWidth));
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) {
    lines.push(line);
  }
  return lines.length ? lines : [''];
}

function textBlock(
  x: number,
  y: number,
  lines: string[],
  fontSize: number,
  fill: string,
  fontWeight = 'normal',
): string {
  return lines
    .map(
      (line, i) =>
        `<text x="${x}" y="${y + i * (fontSize + 6)}" font-family="system-ui,sans-serif" font-size="${fontSize}" font-weight="${fontWeight}" fill="${fill}">${escapeXml(line)}</text>`,
    )
    .join('\n');
}

function slideBackground(y0: number): string {
  return `<rect x="0" y="${y0}" width="${SLIDE_W}" height="${SLIDE_H}" fill="#f8fafc"/>`;
}

function questionBody(question: QuestionAst): string[] {
  if (question.type === 'multiple-choice' || question.type === 'multiple-select') {
    return question.options.map((o) => `• ${o}`);
  }
  if (question.type === 'ordering') {
    return question.options.map((o) => `• ${o}`);
  }
  if (question.type === 'matching') {
    return [`Left: ${question.left.join(', ')}`, `Right: ${question.right.join(', ')}`];
  }
  return [];
}

function renderSlide(
  y0: number,
  section: SectionAst,
  question: QuestionAst,
  mode: 'question' | 'answer',
  showWatermark: boolean,
): string {
  const contentW = SLIDE_W - MARGIN * 2;
  let y = y0 + MARGIN;
  const parts: string[] = [slideBackground(y0)];

  parts.push(
    textBlock(MARGIN, y, [section.sectionType.toUpperCase()], 12, '#64748b'),
  );
  y += LINE;

  const kicker = mode === 'question' ? '' : 'Answer';
  if (kicker) {
    parts.push(textBlock(MARGIN, y, [kicker.toUpperCase()], 12, '#64748b'));
    y += LINE;
  }

  const stemLines = wrapText(question.question, contentW, 22);
  parts.push(textBlock(MARGIN, y + 16, stemLines, 22, '#0f172a', '600'));
  y += 16 + stemLines.length * 28;

  if (mode === 'question') {
    const meta = [question.theme, question.difficulty, question.type].filter(Boolean).join(' · ');
    if (meta) {
      parts.push(textBlock(MARGIN, y, [meta], 11, '#94a3b8'));
      y += LINE;
    }
    for (const line of questionBody(question)) {
      const wrapped = wrapText(line, contentW, 16);
      parts.push(textBlock(MARGIN, y, wrapped, 16, '#334155'));
      y += wrapped.length * 22;
    }
  } else {
    for (const line of formatAnswerLines(question)) {
      const wrapped = wrapText(line, contentW, 18);
      parts.push(textBlock(MARGIN, y, wrapped, 18, '#0f172a'));
      y += wrapped.length * 24;
    }
  }

  if (showWatermark) {
    const wy = y0 + SLIDE_H - MARGIN;
    parts.push(
      `<text x="${SLIDE_W / 2}" y="${wy}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="10" fill="#64748b">${escapeXml(WATERMARK_TEXT)}</text>`,
    );
  }

  return `<g>${parts.join('\n')}</g>`;
}

/**
 * Static SVG slide deck (vector handouts). Free tier includes attribution; Pro omits it.
 */
export function renderSvgSlideDeck(
  ast: QuizAst,
  options: RenderSvgSlideDeckOptions = {},
): string {
  const tier = options.tier ?? 'free';
  const showWatermark = shouldWatermarkExport(tier);
  const groups: string[] = [];

  let slideIndex = 0;
  for (const section of ast.sections) {
    for (const question of section.questions) {
      const y0 = slideIndex * SLIDE_H;
      groups.push(renderSlide(y0, section, question, 'question', showWatermark));
      slideIndex += 1;
      const y1 = slideIndex * SLIDE_H;
      groups.push(renderSlide(y1, section, question, 'answer', showWatermark));
      slideIndex += 1;
    }
  }

  const totalH = slideIndex * SLIDE_H;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${SLIDE_W}" height="${totalH}" viewBox="0 0 ${SLIDE_W} ${totalH}">
${groups.join('\n')}
</svg>`;
}
