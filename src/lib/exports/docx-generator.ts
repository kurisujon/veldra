import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { UnifiedReportData } from './report-builder';

export class DocxGenerator {
  static async generate(data: UnifiedReportData, title: string = 'Verification Report'): Promise<Buffer> {
    const children: Paragraph[] = [
      new Paragraph({
        text: title,
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 300 },
      }),
      new Paragraph({
        text: 'Applicant Information',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Name: ', bold: true }),
          new TextRun({ text: `${data.applicant.first_name} ${data.applicant.last_name}` })
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Date of Birth: ', bold: true }),
          new TextRun({ text: data.applicant.date_of_birth })
        ],
        spacing: { after: 200 },
      }),
      new Paragraph({
        text: 'Findings',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      }),
    ];

    if (data.findings.length > 0) {
      data.findings.forEach(f => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: f.title, bold: true }),
              new TextRun({ text: ` [${f.severity} Severity]` })
            ],
            spacing: { before: 100 }
          }),
          new Paragraph({ text: f.description }),
          new Paragraph({ 
            text: `Category: ${f.category} | Status: ${f.status}`,
            spacing: { after: 100 }
          })
        );
      });
    } else {
      children.push(new Paragraph({ text: 'No findings recorded.', spacing: { after: 200 } }));
    }

    children.push(
      new Paragraph({
        text: 'Generated Drafts',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      })
    );

    if (data.drafts.length > 0) {
      data.drafts.forEach(d => {
        children.push(
          new Paragraph({
            text: d.type,
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 100 }
          }),
          new Paragraph({
            text: d.content,
            spacing: { after: 100 }
          })
        );
      });
    } else {
      children.push(new Paragraph({ text: 'No drafts generated.' }));
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children,
      }],
    });

    return await Packer.toBuffer(doc);
  }
}
