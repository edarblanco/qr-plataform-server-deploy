import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';
import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs';

// process.cwd() = /server — más confiable que __dirname en ts-node/SWC dev mode
const LOGO_PATH = path.join(process.cwd(), 'src', 'assets', 'logo.png');
const QR_SIZE   = 300;
const LOGO_SIZE = 72; // ~24% del QR — safe con errorCorrectionLevel H (soporta 30%)

@Injectable()
export class QrService {
  async generateQR(url: string): Promise<string> {
    try {
      const qrBuffer = await QRCode.toBuffer(url, {
        width: QR_SIZE,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      if (!fs.existsSync(LOGO_PATH)) {
        // Sin logo: devuelve el QR sin compositar
        return `data:image/png;base64,${qrBuffer.toString('base64')}`;
      }

      const logoBuffer = await sharp(LOGO_PATH)
        .resize(LOGO_SIZE, LOGO_SIZE, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .png()
        .toBuffer();

      const top  = Math.round((QR_SIZE - LOGO_SIZE) / 2);
      const left = Math.round((QR_SIZE - LOGO_SIZE) / 2);

      const composited = await sharp(qrBuffer)
        .composite([{ input: logoBuffer, top, left }])
        .png()
        .toBuffer();

      return `data:image/png;base64,${composited.toString('base64')}`;
    } catch (error) {
      throw new Error(`Error generating QR code: ${error.message}`);
    }
  }

  async generateQRBuffer(url: string): Promise<Buffer> {
    try {
      return await QRCode.toBuffer(url, {
        width: QR_SIZE,
        margin: 2,
        errorCorrectionLevel: 'H',
      });
    } catch (error) {
      throw new Error(`Error generating QR code buffer: ${error.message}`);
    }
  }
}
