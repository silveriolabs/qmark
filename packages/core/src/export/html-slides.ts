import type { QuestionAst, QuizAst, SectionAst } from '../ast/types';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function questionSlide(section: SectionAst, question: QuestionAst): string {
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

  return `<section class="slide" data-question-id="${escapeHtml(question.id)}">
  <p class="kicker">${title}</p>
  <h2>${stem}</h2>
  <p class="meta">${escapeHtml(meta)}</p>
  ${body}
</section>`;
}

/**
 * Static full-screen HTML slide deck (free tier). Pair with browser print → PDF.
 */
export function renderHtmlSlideDeck(ast: QuizAst): string {
  const slides = ast.sections.flatMap((section) =>
    section.questions.map((q) => questionSlide(section, q)),
  );

  const title = escapeHtml(ast.name);

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
    .meta { color: #64748b; font-size: 0.9rem; }
    ul { font-size: 1.25rem; line-height: 1.6; }
    @media print { .slide { page-break-after: always; min-height: auto; } }
  </style>
</head>
<body>
${slides.join('\n')}
</body>
</html>`;
}
