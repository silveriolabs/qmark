/** Watermark shown bottom-center on every exported slide and page. Rendered as "Made with ♥ by silverio-labs". */
export const WATERMARK = {
  before: 'Made with',
  after: 'by silverio-labs',
  url: 'https://silverio-labs.com/qmark',
  heartColor: '#e11d48',
} as const;

export const WATERMARK_TEXT = `${WATERMARK.before} \u2665 ${WATERMARK.after}`;

export const WATERMARK_CSS = `
    .slide { position: relative; }
    .watermark {
      position: absolute; left: 50%; bottom: 1rem; transform: translateX(-50%);
      margin: 0; font-size: 0.75rem; letter-spacing: 0.04em; white-space: nowrap;
      color: #64748b; pointer-events: auto;
    }
    .watermark a { color: inherit; text-decoration: none; }
    .watermark .heart { color: ${WATERMARK.heartColor}; }
    @media print { .watermark { position: absolute; } }`;

export function watermarkHtml(): string {
  return `<p class="watermark"><a href="${WATERMARK.url}" target="_blank" rel="noopener">${WATERMARK.before} <span class="heart" aria-label="heart">&#9829;</span> ${WATERMARK.after}</a></p>`;
}
