import { WATERMARK } from '@silverio-labs/qmark-core';

const FONT_SIZE = 8;
const BOTTOM_OFFSET = 24;
const GAP = 3;
const TEXT_COLOR = '#64748b';

/** Vector heart (standard PDF fonts have no ♥ glyph), drawn in a size×size box at (x, y). */
function drawHeart(doc: PDFKit.PDFDocument, x: number, y: number, size: number): void {
  const w = size;
  const h = size;
  doc
    .save()
    .moveTo(x + w / 2, y + h)
    .bezierCurveTo(x - w * 0.1, y + h * 0.55, x, y - h * 0.05, x + w / 2, y + h * 0.28)
    .bezierCurveTo(x + w, y - h * 0.05, x + w * 1.1, y + h * 0.55, x + w / 2, y + h)
    .fill(WATERMARK.heartColor)
    .restore();
}

function drawWatermark(doc: PDFKit.PDFDocument): void {
  const { x: savedX, y: savedY } = doc;
  const savedBottom = doc.page.margins.bottom;
  // Writing inside the bottom margin would otherwise trigger an automatic page break.
  doc.page.margins.bottom = 0;

  doc.save().font('Helvetica').fontSize(FONT_SIZE).fillColor(TEXT_COLOR);
  const heartSize = FONT_SIZE * 0.85;
  const beforeW = doc.widthOfString(WATERMARK.before);
  const afterW = doc.widthOfString(WATERMARK.after);
  const total = beforeW + GAP + heartSize + GAP + afterW;
  const y = doc.page.height - BOTTOM_OFFSET;
  let x = (doc.page.width - total) / 2;

  const opts = { lineBreak: false, link: WATERMARK.url } as const;
  doc.text(WATERMARK.before, x, y, opts);
  x += beforeW + GAP;
  drawHeart(doc, x, y + (FONT_SIZE - heartSize) / 2, heartSize);
  x += heartSize + GAP;
  doc.fillColor(TEXT_COLOR).text(WATERMARK.after, x, y, opts);
  doc.restore();

  doc.fillColor('#000').fontSize(12);
  doc.page.margins.bottom = savedBottom;
  doc.x = savedX;
  doc.y = savedY;
}

/** Stamps the watermark bottom-center on every page added after this call. */
export function applyPdfWatermark(doc: PDFKit.PDFDocument): void {
  doc.on('pageAdded', () => drawWatermark(doc));
}
