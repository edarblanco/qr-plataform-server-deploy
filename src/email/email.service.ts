import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    const mailPort = parseInt(this.configService.get('MAIL_PORT', '587'));
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('MAIL_HOST', 'localhost'),
      port: mailPort,
      secure: mailPort === 465, // true para puerto 465, false para otros puertos
      auth: {
        user: this.configService.get('MAIL_USER'),
        pass: this.configService.get('MAIL_PASSWORD'),
      },
    });
  }

  private calcTax(subtotal: number): number {
    if (subtotal <= 5000) return subtotal * 0.07;
    return subtotal * 0.06 + 50;
  }

  private taxLabel(subtotal: number): string {
    if (subtotal <= 5000) return 'Taxes (FL 6% + Miami-Dade 1%)';
    return 'Taxes (FL 6% + Miami-Dade $50 cap)';
  }

  private buildProductsHtml(lead: any, product: any): string {
    const cellStyle =
      'padding:8px 12px; border:1px solid #e2e8f0; font-size:14px;';
    const rightCell = `${cellStyle} text-align:right; font-family:monospace;`;

    if (lead.items && lead.items.length > 0) {
      const subtotal: number = lead.items.reduce(
        (sum: number, i: any) => sum + i.productPrice,
        0,
      );
      const tax = this.calcTax(subtotal);
      const total = subtotal + tax;

      const rows = lead.items
        .map(
          (item: any) => `
          <tr>
            <td style="${cellStyle}"><strong>${item.productName}</strong></td>
            <td style="${cellStyle} color:#718096;">${item.productSku}</td>
            <td style="${cellStyle}">${item.productBrand || '—'}</td>
            <td style="${rightCell}">$${item.productPrice.toFixed(2)}</td>
            <td style="${cellStyle} color:#718096;">${item.notes || '—'}</td>
          </tr>`,
        )
        .join('');

      return `
        <table style="width:100%; border-collapse:collapse; margin-top:8px;">
          <thead>
            <tr style="background:#edf2f7;">
              <th style="${cellStyle} text-align:left;">Producto</th>
              <th style="${cellStyle} text-align:left;">SKU</th>
              <th style="${cellStyle} text-align:left;">Marca</th>
              <th style="${cellStyle} text-align:right;">Precio</th>
              <th style="${cellStyle} text-align:left;">Notas</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr style="background:#f7fafc;">
              <td colspan="3" style="${cellStyle}">Subtotal</td>
              <td style="${rightCell}">$${subtotal.toFixed(2)}</td>
              <td style="${cellStyle}"></td>
            </tr>
            <tr style="background:#f7fafc;">
              <td colspan="3" style="${cellStyle}">${this.taxLabel(subtotal)}</td>
              <td style="${rightCell}">$${tax.toFixed(2)}</td>
              <td style="${cellStyle}"></td>
            </tr>
            <tr style="background:#e2e8f0;">
              <td colspan="3" style="${cellStyle}"><strong>Total</strong></td>
              <td style="${rightCell}"><strong>$${total.toFixed(2)}</strong></td>
              <td style="${cellStyle}"></td>
            </tr>
          </tfoot>
        </table>`;
    }

    // Producto simple (legacy)
    const subtotal: number = product.price;
    const tax = this.calcTax(subtotal);
    const total = subtotal + tax;
    return `
      <table style="width:100%; border-collapse:collapse; margin-top:8px;">
        <tbody>
          <tr>
            <td style="${cellStyle}"><strong>${product.name}</strong></td>
            <td style="${cellStyle} color:#718096;">${product.sku}</td>
            <td style="${cellStyle}">${product.brand || '—'}</td>
            <td style="${rightCell}">$${subtotal.toFixed(2)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr style="background:#f7fafc;">
            <td colspan="2" style="${cellStyle}">Subtotal</td>
            <td colspan="2" style="${rightCell}">$${subtotal.toFixed(2)}</td>
          </tr>
          <tr style="background:#f7fafc;">
            <td colspan="2" style="${cellStyle}">${this.taxLabel(subtotal)}</td>
            <td colspan="2" style="${rightCell}">$${tax.toFixed(2)}</td>
          </tr>
          <tr style="background:#e2e8f0;">
            <td colspan="2" style="${cellStyle}"><strong>Total</strong></td>
            <td colspan="2" style="${rightCell}"><strong>$${total.toFixed(2)}</strong></td>
          </tr>
        </tfoot>
      </table>`;
  }

  async sendLeadNotification(lead: any, product: any): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto;">
        <h2 style="color: #333;">Nueva Solicitud de Cotización</h2>

        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #666; margin-top: 0;">Información del Cliente</h3>
          <p><strong>Nombre:</strong> ${lead.clientName}</p>
          <p><strong>Email:</strong> ${lead.clientEmail}</p>
          <p><strong>Teléfono:</strong> ${lead.clientPhone || 'No proporcionado'}</p>
        </div>

        ${
          lead.message
            ? `<div style="background:#fffaf0; border:1px solid #feebc8; padding:16px; border-radius:5px; margin:20px 0;">
                <h3 style="color:#7c2d12; margin-top:0; font-size:13px; text-transform:uppercase;">Mensaje del cliente</h3>
                <p style="margin:0; color:#2d3748;">${lead.message}</p>
               </div>`
            : ''
        }

        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #666; margin-top: 0;">Productos Solicitados</h3>
          ${this.buildProductsHtml(lead, product)}
        </div>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          Fecha: ${new Date().toLocaleString('es-ES')}
        </p>
      </div>
    `;

    try {
      const emailFrom = this.configService.get('EMAIL_FROM') || this.configService.get('MAIL_USER');
      const adminEmail = this.configService.get('ADMIN_EMAIL') || this.configService.get('MAIL_USER');

      await this.transporter.sendMail({
        from: emailFrom,
        to: adminEmail,
        subject: `Nueva cotización: ${product.name}`,
        html,
      });
    } catch (error) {
      console.error('Error sending email:', error);
      // No lanzamos error para no bloquear la creación del lead
    }
  }

  async sendWelcomeEmail(user: any): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Bienvenido a QR Showroom Platform</h2>
        <p>Hola ${user.name},</p>
        <p>Tu cuenta ha sido creada exitosamente.</p>
        <p>Ahora puedes acceder al panel de administración y comenzar a gestionar tus productos y leads.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          Este es un mensaje automático, por favor no respondas a este correo.
        </p>
      </div>
    `;

    try {
      const emailFrom = this.configService.get('EMAIL_FROM') || this.configService.get('MAIL_USER');

      await this.transporter.sendMail({
        from: emailFrom,
        to: user.email,
        subject: 'Bienvenido a QR Showroom Platform',
        html,
      });
    } catch (error) {
      console.error('Error sending welcome email:', error);
    }
  }
}
