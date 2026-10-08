import type { QuestionAst, QuizAst, SectionAst } from '../ast/types';
import { DEFAULT_PHOTO_ANCHOR, photoLookupKey } from '../photo/resolve-photo-url';
import { shouldWatermarkExport, type QMarkTier } from '../tier/features';
import { WATERMARK_TEXT } from '../watermark/watermark';
import { iterateDeckFrames } from './deck-sequence';
import { formatAnswerLines } from './format-answer';

const SLIDE_W = 612;
const SLIDE_H = 792;
const MARGIN = 48;
const LINE = 22;
const PHOTO_GAP = 16;
const SIDE_PHOTO_RATIO = 0.4;
const CORNER_PHOTO_WIDTH_RATIO = 0.45;
const STACKED_PHOTO_HEIGHT_RATIO = 0.35;

export interface RenderSvgSlideDeckOptions {
  tier?: QMarkTier;
  /**
   * Prefetched question photos keyed by the resolved public URL.
   * Values are data URIs (`data:image/png;base64,…` or JPEG).
   */
  photos?: ReadonlyMap<string, string>;
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

interface PhotoSlot {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Text column after the photo is reserved. */
  textX: number;
  textY: number;
  textW: number;
  aspect: string;
}

function photoSlot(y0: number, question: QuestionAst, href: string | undefined): PhotoSlot | undefined {
  if (!href) return undefined;
  const anchor = question.photoAnchor ?? DEFAULT_PHOTO_ANCHOR;
  const contentW = SLIDE_W - MARGIN * 2;
  const contentH = SLIDE_H - MARGIN * 2;
  const sideW = contentW * SIDE_PHOTO_RATIO;
  const stackedH = contentH * STACKED_PHOTO_HEIGHT_RATIO;
  const cornerW = contentW * CORNER_PHOTO_WIDTH_RATIO;
  const base: PhotoSlot = {
    x: MARGIN,
    y: y0 + MARGIN,
    w: contentW,
    h: stackedH,
    textX: MARGIN,
    textY: y0 + MARGIN,
    textW: contentW,
    aspect: 'xMidYMid meet',
  };

  switch (anchor) {
    case 'left':
      return {
        ...base,
        w: sideW,
        h: contentH,
        textX: MARGIN + sideW + PHOTO_GAP,
        textW: contentW - sideW - PHOTO_GAP,
        aspect: 'xMidYMid meet',
      };
    case 'right':
      return {
        ...base,
        x: SLIDE_W - MARGIN - sideW,
        w: sideW,
        h: contentH,
        textW: contentW - sideW - PHOTO_GAP,
        aspect: 'xMidYMid meet',
      };
    case 'center':
      return { ...base, textY: y0 + MARGIN + stackedH + PHOTO_GAP };
    case 'top-left':
      return {
        ...base,
        w: cornerW,
        aspect: 'xMinYMin meet',
        textY: y0 + MARGIN + stackedH + PHOTO_GAP,
      };
    case 'top-right':
      return {
        ...base,
        x: SLIDE_W - MARGIN - cornerW,
        w: cornerW,
        aspect: 'xMaxYMin meet',
        textY: y0 + MARGIN + stackedH + PHOTO_GAP,
      };
    case 'bottom-left':
      return {
        ...base,
        y: y0 + SLIDE_H - MARGIN - stackedH,
        w: cornerW,
        aspect: 'xMinYMax meet',
      };
    case 'bottom-right':
      return {
        ...base,
        x: SLIDE_W - MARGIN - cornerW,
        y: y0 + SLIDE_H - MARGIN - stackedH,
        w: cornerW,
        aspect: 'xMaxYMax meet',
      };
  }
}

function photoImage(slot: PhotoSlot, dataUri: string): string {
  const href = escapeXml(dataUri);
  return `<image href="${href}" xlink:href="${href}" x="${slot.x}" y="${slot.y}" width="${slot.w}" height="${slot.h}" preserveAspectRatio="${slot.aspect}"/>`;
}

function renderSlide(
  y0: number,
  section: SectionAst,
  question: QuestionAst,
  mode: 'question' | 'answer',
  showWatermark: boolean,
  photoHref: string | undefined,
): string {
  const slot = photoSlot(y0, question, photoHref);
  const textX = slot?.textX ?? MARGIN;
  const contentW = slot?.textW ?? SLIDE_W - MARGIN * 2;
  let y = slot?.textY ?? y0 + MARGIN;
  const parts: string[] = [slideBackground(y0)];
  if (slot && photoHref) {
    parts.push(photoImage(slot, photoHref));
  }

  parts.push(
    textBlock(textX, y, [section.sectionType.toUpperCase()], 12, '#64748b'),
  );
  y += LINE;

  const kicker = mode === 'question' ? '' : 'Answer';
  if (kicker) {
    parts.push(textBlock(textX, y, [kicker.toUpperCase()], 12, '#64748b'));
    y += LINE;
  }

  const stemLines = wrapText(question.question, contentW, 22);
  parts.push(textBlock(textX, y + 16, stemLines, 22, '#0f172a', '600'));
  y += 16 + stemLines.length * 28;

  if (mode === 'question') {
    const meta = [question.theme, question.difficulty, question.type].filter(Boolean).join(' · ');
    if (meta) {
      parts.push(textBlock(textX, y, [meta], 11, '#94a3b8'));
      y += LINE;
    }
    for (const line of questionBody(question)) {
      const wrapped = wrapText(line, contentW, 16);
      parts.push(textBlock(textX, y, wrapped, 16, '#334155'));
      y += wrapped.length * 22;
    }
  } else {
    for (const line of formatAnswerLines(question)) {
      const wrapped = wrapText(line, contentW, 18);
      parts.push(textBlock(textX, y, wrapped, 18, '#0f172a'));
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

function renderTitleSlide(y0: number, quiz: QuizAst, showWatermark: boolean): string {
  const contentW = SLIDE_W - MARGIN * 2;
  const parts: string[] = [slideBackground(y0)];
  const nameLines = wrapText(quiz.name, contentW, 32);
  let y = y0 + SLIDE_H / 2 - (nameLines.length * 38) / 2;
  for (const line of nameLines) {
    parts.push(
      `<text x="${SLIDE_W / 2}" y="${y}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="32" font-weight="700" fill="#0f172a">${escapeXml(line)}</text>`,
    );
    y += 38;
  }
  parts.push(
    `<text x="${SLIDE_W / 2}" y="${y + 8}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="16" fill="#64748b">${escapeXml(`Version ${quiz.version}`)}</text>`,
  );

  if (showWatermark) {
    const wy = y0 + SLIDE_H - MARGIN;
    parts.push(
      `<text x="${SLIDE_W / 2}" y="${wy}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="10" fill="#64748b">${escapeXml(WATERMARK_TEXT)}</text>`,
    );
  }

  return `<g>${parts.join('\n')}</g>`;
}

function renderSectionIntroSlide(
  y0: number,
  section: SectionAst,
  showWatermark: boolean,
): string {
  const contentW = SLIDE_W - MARGIN * 2;
  let y = y0 + MARGIN;
  const parts: string[] = [slideBackground(y0)];

  parts.push(
    textBlock(MARGIN, y, [section.sectionType.toUpperCase()], 12, '#64748b'),
  );
  y += LINE + 8;

  parts.push(textBlock(MARGIN, y, ['Goal'], 14, '#0f172a', '600'));
  y += 20;
  for (const line of wrapText(section.goal, contentW, 16)) {
    parts.push(textBlock(MARGIN, y, [line], 16, '#64748b'));
    y += 22;
  }
  y += 12;

  parts.push(textBlock(MARGIN, y, ['Instructions'], 14, '#0f172a', '600'));
  y += 20;
  for (const line of wrapText(section.instructions, contentW, 16)) {
    parts.push(textBlock(MARGIN, y, [line], 16, '#334155'));
    y += 22;
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
  const photoHref = (question: QuestionAst): string | undefined => {
    const key = question.photo ? photoLookupKey(question.photo) : undefined;
    return key ? options.photos?.get(key) : undefined;
  };

  let slideIndex = 0;
  for (const frame of iterateDeckFrames(ast)) {
    const y0 = slideIndex * SLIDE_H;
    switch (frame.kind) {
      case 'title':
        groups.push(renderTitleSlide(y0, frame.quiz, showWatermark));
        break;
      case 'section-intro':
        groups.push(renderSectionIntroSlide(y0, frame.section, showWatermark));
        break;
      case 'question':
        groups.push(
          renderSlide(
            y0,
            frame.section,
            frame.question,
            'question',
            showWatermark,
            photoHref(frame.question),
          ),
        );
        break;
      case 'answer':
        groups.push(
          renderSlide(
            y0,
            frame.section,
            frame.question,
            'answer',
            showWatermark,
            photoHref(frame.question),
          ),
        );
        break;
    }
    slideIndex += 1;
  }

  const totalH = slideIndex * SLIDE_H;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${SLIDE_W}" height="${totalH}" viewBox="0 0 ${SLIDE_W} ${totalH}">
${groups.join('\n')}
</svg>`;
}
