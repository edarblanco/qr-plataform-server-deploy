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

  async sendLeadNotification(lead: any, product: any): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Nueva Solicitud de Cotización</h2>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #666; margin-top: 0;">Información del Producto</h3>
          <p><strong>Producto:</strong> ${product.name}</p>
          <p><strong>SKU:</strong> ${product.sku}</p>
          <p><strong>Marca:</strong> ${product.brand || 'N/A'}</p>
          <p><strong>Precio:</strong> $${product.price}</p>
        </div>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #666; margin-top: 0;">Información del Cliente</h3>
          <p><strong>Nombre:</strong> ${lead.clientName}</p>
          <p><strong>Email:</strong> ${lead.clientEmail}</p>
          <p><strong>Teléfono:</strong> ${lead.clientPhone || 'No proporcionado'}</p>
        </div>
        ${
          lead.message
            ? `
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #666; margin-top: 0;">Mensaje</h3>
          <p>${lead.message}</p>
        </div>
        `
            : ''
        }
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
