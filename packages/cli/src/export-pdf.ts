import { createWriteStream } from 'node:fs';
import PDFDocument from 'pdfkit';
import {
  DEFAULT_PHOTO_ANCHOR,
  formatAnswerLines,
  iterateDeckFrames,
  resolvePhotoUrl,
  shouldWatermarkExport,
  type PhotoAnchor,
  type QMarkTier,
  type QuestionAst,
  type QuizAst,
  type SectionAst,
} from '@silverio-labs/qmark-core';
import { prefetchPhotos } from './fetch-photos';
import { applyPdfWatermark } from './watermark-pdf';

const PAGE = { width: 612, height: 792 };
const PAGE_MARGIN = 48;
const PHOTO_GAP = 16;
const SIDE_PHOTO_RATIO = 0.4;
const CORNER_PHOTO_WIDTH_RATIO = 0.45;
const STACKED_PHOTO_HEIGHT_RATIO = 0.35;

/** Adds a question page, drawing the photo and shrinking margins so text flows around it. */
function addQuestionPage(doc: PDFKit.PDFDocument, photo: Buffer | undefined, anchor: PhotoAnchor) {
  if (!photo) {
    doc.addPage();
    return;
  }

  const contentW = PAGE.width - PAGE_MARGIN * 2;
  const contentH = PAGE.height - PAGE_MARGIN * 2;
  const margins = { top: PAGE_MARGIN, bottom: PAGE_MARGIN, left: PAGE_MARGIN, right: PAGE_MARGIN };
  let box: { x: number; y: number; w: number; h: number };
  let align: 'left' | 'center' | 'right' = 'center';
  let valign: 'top' | 'center' | 'bottom' = 'center';

  const sideW = contentW * SIDE_PHOTO_RATIO;
  const stackedH = contentH * STACKED_PHOTO_HEIGHT_RATIO;
  const cornerW = contentW * CORNER_PHOTO_WIDTH_RATIO;

  switch (anchor) {
    case 'left':
      box = { x: PAGE_MARGIN, y: PAGE_MARGIN, w: sideW, h: contentH };
      margins.left += sideW + PHOTO_GAP;
      break;
    case 'right':
      box = { x: PAGE.width - PAGE_MARGIN - sideW, y: PAGE_MARGIN, w: sideW, h: contentH };
      margins.right += sideW + PHOTO_GAP;
      break;
    case 'center':
      box = { x: PAGE_MARGIN, y: PAGE_MARGIN, w: contentW, h: stackedH };
      margins.top += stackedH + PHOTO_GAP;
      break;
    case 'top-left':
    case 'top-right':
      box = {
        x: anchor === 'top-left' ? PAGE_MARGIN : PAGE.width - PAGE_MARGIN - cornerW,
        y: PAGE_MARGIN,
        w: cornerW,
        h: stackedH,
      };
      align = anchor === 'top-left' ? 'left' : 'right';
      valign = 'top';
      margins.top += stackedH + PHOTO_GAP;
      break;
    case 'bottom-left':
    case 'bottom-right':
      box = {
        x: anchor === 'bottom-left' ? PAGE_MARGIN : PAGE.width - PAGE_MARGIN - cornerW,
        y: PAGE.height - PAGE_MARGIN - stackedH,
        w: cornerW,
        h: stackedH,
      };
      align = anchor === 'bottom-left' ? 'left' : 'right';
      valign = 'bottom';
      margins.bottom += stackedH + PHOTO_GAP;
      break;
  }

  doc.addPage({ size: [PAGE.width, PAGE.height], margins });
  try {
    doc.image(photo, box.x, box.y, {
      fit: [box.w, box.h],
      align: align === 'left' ? undefined : align,
      valign: valign === 'top' ? undefined : valign,
    });
  } catch {
    // Corrupt image data: leave the slot empty rather than failing the export.
  }
  doc.x = margins.left;
  doc.y = margins.top;
}

function photoFor(question: QuestionAst, photos: Map<string, Buffer>): Buffer | undefined {
  const url = question.photo ? resolvePhotoUrl(question.photo) : undefined;
  return url ? photos.get(url) : undefined;
}

function addSectionIntroPage(doc: PDFKit.PDFDocument, section: SectionAst): void {
  doc.addPage();
  doc.fontSize(10).fillColor('#666').text(section.sectionType.toUpperCase());
  doc.fillColor('#000').moveDown(0.75).fontSize(14).text('Instructions');
  doc.moveDown(0.25).fontSize(16).text(section.instructions);
  doc.moveDown().fontSize(14).text('Goal');
  doc.moveDown(0.25).fontSize(16).fillColor('#444').text(section.goal);
  doc.fillColor('#000');
}

export interface WriteQuizPdfOptions {
  tier?: QMarkTier;
}

export async function writeQuizPdf(
  ast: QuizAst,
  outputPath: string,
  options: WriteQuizPdfOptions = {},
): Promise<void> {
  const tier = options.tier ?? 'free';
  const photos = await prefetchPhotos(ast);
  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ autoFirstPage: false, size: [PAGE.width, PAGE.height], margin: PAGE_MARGIN });
    const stream = createWriteStream(outputPath);
    doc.pipe(stream);
    if (shouldWatermarkExport(tier)) {
      applyPdfWatermark(doc);
    }

    doc.addPage().fontSize(32).text(ast.name, { align: 'center' });
    doc.moveDown().fontSize(16).fillColor('#555').text(`Version ${ast.version}`, {
      align: 'center',
    });
    doc.fillColor('#000');

    for (const frame of iterateDeckFrames(ast)) {
      switch (frame.kind) {
        case 'section-intro':
          addSectionIntroPage(doc, frame.section);
          break;
        case 'question': {
          const { section, question } = frame;
          addQuestionPage(doc, photoFor(question, photos), question.photoAnchor ?? DEFAULT_PHOTO_ANCHOR);
          doc.fontSize(10).fillColor('#666').text(section.sectionType.toUpperCase());
          doc.fillColor('#000').moveDown(0.5).fontSize(22).text(question.question);
          doc.moveDown().fontSize(10).fillColor('#888');
          doc.text([question.type, question.difficulty, question.theme].filter(Boolean).join(' · '));
          doc.fillColor('#000').moveDown();

          if (question.type === 'multiple-choice' || question.type === 'multiple-select') {
            for (const option of question.options) {
              doc.fontSize(16).text(`• ${option}`);
            }
          } else if (question.type === 'ordering') {
            for (const option of question.options) {
              doc.fontSize(16).text(`• ${option}`);
            }
          } else if (question.type === 'matching') {
            doc.fontSize(16).text(`Left: ${question.left.join(', ')}`);
            doc.text(`Right: ${question.right.join(', ')}`);
          }
          break;
        }
        case 'answer': {
          const { question } = frame;
          addQuestionPage(doc, photoFor(question, photos), question.photoAnchor ?? DEFAULT_PHOTO_ANCHOR);
          doc.fontSize(10).fillColor('#666').text('ANSWER');
          doc.fillColor('#000').moveDown(0.5).fontSize(20).text(question.question);
          doc.moveDown().fontSize(26);
          for (const line of formatAnswerLines(question)) {
            doc.text(line);
          }
          break;
        }
      }
    }

    const keyed = ast.sections.flatMap((section) => section.questions);
    const startKeyPage = () => {
      doc.addPage();
      const { width, height } = doc.page;
      doc.save();
      doc.translate(width / 2, height / 2);
      doc.rotate(180);
      doc.translate(-width / 2, -height / 2);
      doc.fillColor('#000');
    };

    const KEY_ITEMS_PER_PAGE = 30;
    const keyFontSize = 10;
    const keyGap = 4;
    const keyWidth = () => doc.page.width - 96;
    const keyBottom = () => doc.page.height - 48;

    const startKeySheet = (continued: boolean) => {
      startKeyPage();
      doc.fontSize(16).text(ast.name, 48, 48, { width: keyWidth() });
      doc
        .moveDown(0.2)
        .fontSize(12)
        .text(continued ? 'Answer key (continued)' : 'Answer key', { width: keyWidth() });
      return doc.y + 10;
    };

    const KEY_COLUMNS = 3;
    const KEY_ROWS = KEY_ITEMS_PER_PAGE / KEY_COLUMNS;
    const columnGap = 16;
    const columnWidth = () => (keyWidth() - columnGap * (KEY_COLUMNS - 1)) / KEY_COLUMNS;
    const columnX = (column: number) => 48 + column * (columnWidth() + columnGap);

    let topY = startKeySheet(false);
    let column = 0;
    let rowsInColumn = 0;
    let itemsOnPage = 0;
    let cursorY = topY;
    keyed.forEach((question, index) => {
      const line = `${index + 1}. ${formatAnswerLines(question).join(' · ')}`;
      doc.fontSize(keyFontSize);
      const height = doc.heightOfString(line, { width: columnWidth() });
      const pageFull = itemsOnPage >= KEY_ITEMS_PER_PAGE;
      if (!pageFull && (rowsInColumn >= KEY_ROWS || cursorY + height > keyBottom())) {
        column += 1;
        rowsInColumn = 0;
        cursorY = topY;
      }
      if (pageFull || column >= KEY_COLUMNS) {
        doc.restore();
        topY = startKeySheet(true);
        doc.fontSize(keyFontSize);
        column = 0;
        rowsInColumn = 0;
        itemsOnPage = 0;
        cursorY = topY;
      }
      doc.text(line, columnX(column), cursorY, { width: columnWidth() });
      cursorY = doc.y + keyGap;
      rowsInColumn += 1;
      itemsOnPage += 1;
    });
    doc.restore();

    doc.end();
    stream.on('finish', () => resolve());
    stream.on('error', reject);
  });
}
