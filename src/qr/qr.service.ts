import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';

@Injectable()
export class QrService {
  async generateQR(url: string): Promise<string> {
    try {
      // Genera QR en formato base64
      const qrDataURL = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      return qrDataURL;
    } catch (error) {
      throw new Error(`Error generating QR code: ${error.message}`);
    }
  }

  async generateQRBuffer(url: string): Promise<Buffer> {
    try {
      return await QRCode.toBuffer(url, {
        width: 300,
        margin: 2,
      });
    } catch (error) {
      throw new Error(`Error generating QR code buffer: ${error.message}`);
    }
  }
}
