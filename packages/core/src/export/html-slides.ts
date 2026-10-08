import type { QuestionAst, QuizAst, SectionAst } from '../ast/types';
import { DEFAULT_PHOTO_ANCHOR, photoLookupKey, resolvePhotoUrl } from '../photo/resolve-photo-url';
import { shouldWatermarkExport, type QMarkTier } from '../tier/features';
import { WATERMARK_CSS, watermarkHtml } from '../watermark/watermark';
import { iterateDeckFrames } from './deck-sequence';
import { formatAnswerLines } from './format-answer';

export interface RenderHtmlSlideDeckOptions {
  /** Defaults to `free` (includes export attribution). Pro and Enterprise omit the watermark. */
  tier?: QMarkTier;
  /**
   * Prefetched photos keyed by {@link photoLookupKey}.
   * Values are data URIs. Local paths are shown only when present here.
   */
  photos?: ReadonlyMap<string, string>;
}

/** Hosts without CORS headers reject `crossorigin` loads; retry as a plain image. */
const PHOTO_CORS_FALLBACK =
  "if(this.hasAttribute('crossorigin')){this.removeAttribute('crossorigin');this.src=this.src;}else{this.closest('figure').remove();}";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function titleSlide(quiz: QuizAst, showWatermark: boolean): string {
  const stamp = showWatermark ? watermarkHtml() : '';
  return `<section class="slide slide-title">
  <div class="content">
  <h1>${escapeHtml(quiz.name)}</h1>
  <p class="meta">Version ${escapeHtml(quiz.version)}</p>
  </div>
  ${stamp}
</section>`;
}

function sectionIntroSlide(section: SectionAst, showWatermark: boolean): string {
  const stamp = showWatermark ? watermarkHtml() : '';
  const title = escapeHtml(section.sectionType);
  const instructions = escapeHtml(section.instructions);
  const goal = escapeHtml(section.goal);

  return `<section class="slide slide-section-intro" data-section-id="${escapeHtml(section.id)}">
  <div class="content">
  <p class="kicker">${title}</p>
  <h3 class="intro-heading">Goal</h3>
  <p class="intro-body goal">${goal}</p>
  <h3 class="intro-heading">Instructions</h3>
  <p class="intro-body">${instructions}</p>
  </div>
  ${stamp}
</section>`;
}

function photoMarkup(
  question: QuestionAst,
  photos: ReadonlyMap<string, string> | undefined,
): { photo: string; slideClass: string } {
  const key = question.photo ? photoLookupKey(question.photo) : undefined;
  const embedded = key ? photos?.get(key) : undefined;
  const photoUrl = embedded ?? (question.photo ? resolvePhotoUrl(question.photo) : undefined);
  const anchor = question.photoAnchor ?? DEFAULT_PHOTO_ANCHOR;
  const remoteAttrs = embedded
    ? ''
    : ` crossorigin="anonymous" referrerpolicy="no-referrer" loading="lazy" decoding="async" onerror="${PHOTO_CORS_FALLBACK}"`;
  const photo = photoUrl
    ? `<figure class="photo"><img src="${escapeHtml(photoUrl)}" alt=""${remoteAttrs} /></figure>`
    : '';
  const slideClass = photoUrl ? `slide has-photo photo-${anchor}` : 'slide';
  return { photo, slideClass };
}

function questionSlideHtml(
  section: SectionAst,
  question: QuestionAst,
  showWatermark: boolean,
  photos: ReadonlyMap<string, string> | undefined,
): string {
  const stamp = showWatermark ? watermarkHtml() : '';
  const title = escapeHtml(section.sectionType);
  const stem = escapeHtml(question.question);
  const meta = [
    question.theme ? escapeHtml(question.theme) : '',
    question.difficulty ?? '',
    question.type,
  ]
    .filter(Boolean)
    .join(' · ');

  let body = '';
  if (question.type === 'multiple-choice' || question.type === 'multiple-select') {
    body = `<ul>${question.options.map((o) => `<li>${escapeHtml(o)}</li>`).join('')}</ul>`;
  } else if (question.type === 'matching') {
    body = `<p><strong>Left:</strong> ${question.left.map(escapeHtml).join(', ')}</p>
<p><strong>Right:</strong> ${question.right.map(escapeHtml).join(', ')}</p>`;
  } else if (question.type === 'ordering') {
    body = `<ul>${question.options.map((o) => `<li>${escapeHtml(o)}</li>`).join('')}</ul>`;
  }

  const { photo, slideClass } = photoMarkup(question, photos);

  return `<section class="${slideClass}" data-question-id="${escapeHtml(question.id)}">
  ${photo}
  <div class="content">
  <p class="kicker">${title}</p>
  <h2>${stem}</h2>
  <p class="meta">${escapeHtml(meta)}</p>
  ${body}
  </div>
  ${stamp}
</section>`;
}

function answerSlideHtml(
  question: QuestionAst,
  showWatermark: boolean,
  photos: ReadonlyMap<string, string> | undefined,
): string {
  const stamp = showWatermark ? watermarkHtml() : '';
  const stem = escapeHtml(question.question);
  const answerBody = formatAnswerLines(question)
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join('');

  const { photo, slideClass } = photoMarkup(question, photos);

  return `<section class="${slideClass} slide-answer" data-question-id="${escapeHtml(question.id)}-answer">
  ${photo}
  <div class="content">
  <p class="kicker">Answer</p>
  <h2>${stem}</h2>
  <ul class="answer-lines">${answerBody}</ul>
  </div>
  ${stamp}
</section>`;
}

/**
 * Static full-screen HTML slide deck. Free tier includes attribution; Pro omits it.
 * Pair with browser print → PDF.
 */
export function renderHtmlSlideDeck(
  ast: QuizAst,
  options: RenderHtmlSlideDeckOptions = {},
): string {
  const tier = options.tier ?? 'free';
  const showWatermark = shouldWatermarkExport(tier);
  const slides: string[] = [];
  for (const frame of iterateDeckFrames(ast)) {
    switch (frame.kind) {
      case 'title':
        slides.push(titleSlide(frame.quiz, showWatermark));
        break;
      case 'section-intro':
        slides.push(sectionIntroSlide(frame.section, showWatermark));
        break;
      case 'question':
        slides.push(questionSlideHtml(frame.section, frame.question, showWatermark, options.photos));
        break;
      case 'answer':
        slides.push(answerSlideHtml(frame.question, showWatermark, options.photos));
        break;
      default: {
        const _exhaustive: never = frame;
        throw new Error(`Unknown deck frame: ${JSON.stringify(_exhaustive)}`);
      }
    }
  }
  const watermarkCss = showWatermark ? WATERMARK_CSS : '';

  const title = escapeHtml(ast.name);

  const keyItems = ast.sections
    .flatMap((section) => section.questions)
    .map((q) => `<li>${escapeHtml(formatAnswerLines(q).join(' · '))}</li>`)
    .join('');
  const answerKey = `<details class="answer-key">
  <summary>Answer key</summary>
  <ol>${keyItems}</ol>
</details>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; }
    .slide {
      min-height: 100vh; min-height: 100dvh;
      padding: 3rem clamp(1.5rem, 5vw, 4rem);
      display: flex; flex-direction: column; justify-content: center;
      border-bottom: 1px solid #334155;
    }
    .kicker { text-transform: uppercase; letter-spacing: 0.08em; font-size: 0.85rem; color: #94a3b8; margin: 0 0 0.5rem; }
    h2 { font-size: clamp(1.5rem, 4vw, 2.75rem); line-height: 1.2; margin: 0 0 1rem; max-width: 40ch; }
    .slide-title { align-items: center; text-align: center; }
    .slide-title h1 { font-size: clamp(2rem, 6vw, 4rem); line-height: 1.1; margin: 0 0 1rem; }
    .slide-section-intro .content { max-width: 48ch; }
    .intro-heading { font-size: 1.1rem; font-weight: 600; margin: 1.25rem 0 0.35rem; color: #e2e8f0; }
    .intro-heading:first-of-type { margin-top: 0.75rem; }
    .intro-body { font-size: 1.25rem; line-height: 1.5; margin: 0; color: #cbd5e1; }
    .intro-body.goal { color: #94a3b8; }
    .meta { color: #64748b; font-size: 0.9rem; }
    .slide.has-photo { position: relative; gap: 2rem; }
    .photo { margin: 0; }
    .photo img { display: block; max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 0.5rem; }
    .photo-left, .photo-right { flex-direction: row; align-items: center; }
    .photo-left .photo, .photo-right .photo { flex: 0 0 40%; max-height: 80vh; display: flex; justify-content: center; }
    .photo-right .photo { order: 2; }
    .photo-left .content, .photo-right .content { flex: 1; min-width: 0; }
    .photo-center { align-items: center; text-align: center; }
    .photo-center .photo img { max-height: 45vh; margin: 0 auto; }
    .photo-center h2 { margin-inline: auto; }
    .photo-center ul { display: inline-block; text-align: left; }
    .photo-top-left .photo, .photo-top-right .photo,
    .photo-bottom-left .photo, .photo-bottom-right .photo { position: absolute; width: min(32%, 28rem); height: 35vh; display: flex; }
    .photo-top-left .photo { top: 2rem; left: 2rem; align-items: flex-start; }
    .photo-top-right .photo { top: 2rem; right: 2rem; align-items: flex-start; justify-content: flex-end; }
    .photo-bottom-left .photo { bottom: 2rem; left: 2rem; align-items: flex-end; }
    .photo-bottom-right .photo { bottom: 2rem; right: 2rem; align-items: flex-end; justify-content: flex-end; }
    .photo-top-left .content, .photo-top-right .content { padding-top: 35vh; }
    .photo-bottom-left .content, .photo-bottom-right .content { padding-bottom: 35vh; }
    @media (max-width: 720px) {
      .photo-left, .photo-right { flex-direction: column; }
      .photo-right .photo { order: 0; }
    }
    ul { font-size: 1.25rem; line-height: 1.6; }
    .slide-answer .answer-lines { font-size: clamp(2rem, 5vw, 3.25rem); font-weight: 700; color: #dc2626; line-height: 1.3; }
    .answer-key { padding: 2rem clamp(1.5rem, 5vw, 4rem); }
    .answer-key summary {
      cursor: pointer; list-style: none; display: inline-flex; align-items: center; gap: 0.5rem;
      text-transform: uppercase; letter-spacing: 0.08em; font-size: 0.85rem; color: #94a3b8;
    }
    .answer-key summary::-webkit-details-marker { display: none; }
    .answer-key summary::before {
      content: ''; width: 0.5em; height: 0.5em;
      border-right: 2px solid currentColor; border-bottom: 2px solid currentColor;
      transform: rotate(-45deg); transition: transform 0.15s ease;
    }
    .answer-key[open] summary::before { transform: rotate(45deg); }
    .answer-key ol { columns: 3 16rem; column-gap: 2rem; font-size: 1rem; line-height: 1.6; }
    .answer-key li { break-inside: avoid; }
    @media print { .slide { page-break-after: always; min-height: auto; } }
${watermarkCss}
  </style>
</head>
<body>
${slides.join('\n')}
${answerKey}
</body>
</html>`;
}
