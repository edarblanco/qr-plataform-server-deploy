import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as handlebars from 'handlebars';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PdfService {
  /**
   * Resolve template path trying multiple possible locations
   * This handles different deployment scenarios
   */
  private resolveTemplatePath(templateName: string): string {
    const possiblePaths = [
      // Production: __dirname = /workspace/dist/src/pdf
      path.join(__dirname, '..', '..', 'pdf', 'templates', templateName),
      // Dev with ts-node: __dirname = /workspace/src/pdf
      path.join(__dirname, '..', '..', 'dist', 'pdf', 'templates', templateName),
      // Alternative: templates next to compiled code
      path.join(__dirname, 'templates', templateName),
      // Alternative: templates in parent directory
      path.join(__dirname, '..', 'templates', templateName),
    ];

    for (const templatePath of possiblePaths) {
      if (fs.existsSync(templatePath)) {
        console.log('[PDF Service] Template found at:', templatePath);
        return templatePath;
      }
    }

    // If not found, throw error with all attempted paths
    throw new InternalServerErrorException(
      `Template ${templateName} not found. Tried: ${possiblePaths.join(', ')}`,
    );
  }

  /**
   * Generate PDF from Handlebars template
   * @param templateName - Name of the .hbs template file
   * @param data - Data to pass to the template
   * @returns Base64 encoded PDF
   */
  async generatePdf(templateName: string, data: any): Promise<string> {
    try {
      const templatePath = this.resolveTemplatePath(templateName);
      const templateSource = fs.readFileSync(templatePath, 'utf8');
      const template = handlebars.compile(templateSource);

      const html = template(data);

      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px',
        }
      });

      await browser.close();

      const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');
      return pdfBase64;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new InternalServerErrorException(`Failed to generate PDF: ${error.message}`);
    }
  }

  /**
   * Generate PDF buffer (useful for direct download)
   */
  async generatePdfBuffer(templateName: string, data: any): Promise<Buffer> {
    const base64 = await this.generatePdf(templateName, data);
    return Buffer.from(base64, 'base64');
  }
}
