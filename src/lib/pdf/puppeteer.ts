import puppeteer from 'puppeteer';

export async function generatePdfFromHtml(htmlContent: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    channel: 'chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  try {
    const page = await browser.newPage();
    
    // Set content and wait for network to be idle
    await page.setContent(htmlContent, {
      waitUntil: 'domcontentloaded',
    });
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm',
      },
      printBackground: true,
    });
    
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
