import { createWriteStream } from 'node:fs';
import PDFDocument from 'pdfkit';
import type { QuizAst } from '@silverio-labs/qmark-core';

export async function writeQuizPdf(ast: QuizAst, outputPath: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ autoFirstPage: false, margin: 48 });
    const stream = createWriteStream(outputPath);
    doc.pipe(stream);

    doc.addPage().fontSize(22).text(ast.name, { align: 'center' });
    doc.moveDown().fontSize(12).fillColor('#555').text(`Version ${ast.version}`, {
      align: 'center',
    });
    doc.fillColor('#000');

    for (const section of ast.sections) {
      for (const question of section.questions) {
        doc.addPage();
        doc.fontSize(10).fillColor('#666').text(section.sectionType.toUpperCase());
        doc.fillColor('#000').moveDown(0.5).fontSize(16).text(question.question);
        doc.moveDown().fontSize(10).fillColor('#888');
        doc.text([question.type, question.difficulty, question.theme].filter(Boolean).join(' · '));
        doc.fillColor('#000').moveDown();

        if (question.type === 'multiple-choice' || question.type === 'multiple-select') {
          for (const option of question.options) {
            doc.fontSize(12).text(`• ${option}`);
          }
        } else if (question.type === 'ordering') {
          for (const option of question.options) {
            doc.fontSize(12).text(`• ${option}`);
          }
        } else if (question.type === 'matching') {
          doc.fontSize(12).text(`Left: ${question.left.join(', ')}`);
          doc.text(`Right: ${question.right.join(', ')}`);
        }
      }
    }

    doc.end();
    stream.on('finish', () => resolve());
    stream.on('error', reject);
  });
}
