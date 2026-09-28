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

    startKeyPage();
    doc.fontSize(28).text(ast.name, 48, 56, {
      width: doc.page.width - 96,
    });
    doc.moveDown(0.4).fontSize(22).text('Answer key', {
      width: doc.page.width - 96,
    });
    let cursorY = doc.y + 16;
    keyed.forEach((question, index) => {
      const line = `${index + 1}. ${formatAnswerLines(question).join(' · ')}`;
      if (cursorY > doc.page.height - 72) {
        doc.restore();
        startKeyPage();
        cursorY = 56;
      }
      doc.fontSize(18).text(line, 48, cursorY, { width: doc.page.width - 96 });
      cursorY = doc.y + 10;
    });
    doc.restore();

    doc.end();
    stream.on('finish', () => resolve());
    stream.on('error', reject);
  });
}
