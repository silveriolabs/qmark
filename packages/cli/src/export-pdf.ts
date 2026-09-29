import { createWriteStream } from 'node:fs';
import PDFDocument from 'pdfkit';
import { formatAnswerLines, type QuizAst } from '@silverio-labs/qmark-core';

export async function writeQuizPdf(ast: QuizAst, outputPath: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ autoFirstPage: false, margin: 48 });
    const stream = createWriteStream(outputPath);
    doc.pipe(stream);

    doc.addPage().fontSize(32).text(ast.name, { align: 'center' });
    doc.moveDown().fontSize(16).fillColor('#555').text(`Version ${ast.version}`, {
      align: 'center',
    });
    doc.fillColor('#000');

    for (const section of ast.sections) {
      for (const question of section.questions) {
        doc.addPage();
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

        doc.addPage();
        doc.fontSize(10).fillColor('#666').text('ANSWER');
        doc.fillColor('#000').moveDown(0.5).fontSize(20).text(question.question);
        doc.moveDown().fontSize(26);
        for (const line of formatAnswerLines(question)) {
          doc.text(line);
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
