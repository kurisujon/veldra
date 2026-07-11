import puppeteer from 'puppeteer';
import { UnifiedReportData } from './report-builder';

export class PDFGenerator {
  static async generate(data: UnifiedReportData, title: string = 'Verification Report'): Promise<Buffer> {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: sans-serif; padding: 2rem; color: #333; }
            h1 { border-bottom: 2px solid #5B6EF5; padding-bottom: 0.5rem; }
            h2 { margin-top: 1.5rem; }
            .section { margin-bottom: 2rem; }
            .item { margin-bottom: 1rem; padding: 1rem; border: 1px solid #ddd; border-radius: 4px; }
            .badge { display: inline-block; padding: 0.2rem 0.5rem; background: #eee; border-radius: 3px; font-size: 0.8rem; }
            .severity-High { background: #fee2e2; color: #991b1b; }
            .severity-Medium { background: #fef3c7; color: #92400e; }
            .severity-Low { background: #e0f2fe; color: #075985; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="section">
            <h2>Applicant Information</h2>
            <p><strong>Name:</strong> ${data.applicant.first_name} ${data.applicant.last_name}</p>
            <p><strong>Date of Birth:</strong> ${data.applicant.date_of_birth}</p>
          </div>
          <div class="section">
            <h2>Findings</h2>
            ${data.findings.length > 0 
              ? data.findings.map(f => `
                <div class="item">
                  <h3>${f.title} <span class="badge severity-${f.severity}">${f.severity}</span></h3>
                  <p>${f.description}</p>
                  <p><small>Category: ${f.category} | Status: ${f.status}</small></p>
                </div>
              `).join('') 
              : '<p>No findings recorded.</p>'}
          </div>
          ${data.drafts.length > 0 
              ? data.drafts.map(d => `
                <div class="draft-item" style="page-break-before: always;">
                  <h3 style="margin-top: 0; padding-top: 2rem;">${d.type}</h3>
                  <pre style="white-space: pre-wrap; font-family: inherit;">${d.content}</pre>
                </div>
              `).join('') 
              : ''}
        </body>
      </html>
    `;
    
    const browser = await puppeteer.launch({ 
      headless: true,
      channel: 'chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
    const pdfUint8Array = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();
    
    return Buffer.from(pdfUint8Array);
  }
}
