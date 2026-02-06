import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Quotation, QuotationStatus } from './schemas/quotation.schema';
import { Lead, LeadStatus } from '../leads/schemas/lead.schema';
import { Customer } from '../customers/schemas/customer.schema';
import { PdfService } from '../pdf/pdf.service';

@Injectable()
export class QuotationsService {
  constructor(
    @InjectModel(Quotation.name) private quotationModel: Model<Quotation>,
    @InjectModel(Lead.name) private leadModel: Model<Lead>,
    @InjectModel(Customer.name) private customerModel: Model<Customer>,
    private readonly pdfService: PdfService,
  ) {}

  async findAll(filters?: {
    status?: QuotationStatus;
    customerId?: string;
    createdBy?: string;
  }): Promise<any[]> {
    const query: any = {};
    if (filters?.status) query.status = filters.status;
    if (filters?.customerId) query.customerId = filters.customerId;
    if (filters?.createdBy) query.createdBy = filters.createdBy;

    return this.quotationModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<any> {
    const quotation = await this.quotationModel.findById(id).exec();
    if (!quotation) {
      throw new NotFoundException(`Cotización con ID ${id} no encontrada`);
    }
    return quotation;
  }

  async create(quotationData: {
    customerId?: string;
    leadId?: string;
    createdBy: string;
    items: any[];
    notes?: string;
    validUntil?: Date;
    tax?: number;
    discount?: number;
  }): Promise<any> {
    // Calculate totals
    const subtotal = quotationData.items.reduce((sum, item) => sum + item.total, 0);
    const tax = quotationData.tax || 0;
    const discount = quotationData.discount || 0;
    const total = subtotal + tax - discount;

    const quotation = new this.quotationModel({
      ...quotationData,
      subtotal,
      tax,
      discount,
      total,
      status: QuotationStatus.DRAFT,
    });

    const saved = await quotation.save();

    // If linked to a lead, update lead status to completed
    if (quotationData.leadId) {
      await this.leadModel.findByIdAndUpdate(quotationData.leadId, {
        status: LeadStatus.COMPLETED,
      }).exec();
    }

    return saved;
  }

  async update(
    id: string,
    updateData: {
      items?: any[];
      notes?: string;
      validUntil?: Date;
      tax?: number;
      discount?: number;
    },
  ): Promise<any> {
    const quotation = await this.quotationModel.findById(id).exec();
    if (!quotation) {
      throw new NotFoundException(`Cotización con ID ${id} no encontrada`);
    }

    // Can only update draft quotations
    if (quotation.status !== QuotationStatus.DRAFT) {
      throw new BadRequestException('Solo se pueden editar cotizaciones en borrador');
    }

    // Update fields
    if (updateData.items) {
      quotation.items = updateData.items;
      // Recalculate totals
      quotation.subtotal = updateData.items.reduce((sum, item) => sum + item.total, 0);
    }
    if (updateData.tax !== undefined) quotation.tax = updateData.tax;
    if (updateData.discount !== undefined) quotation.discount = updateData.discount;
    if (updateData.notes) quotation.notes = updateData.notes;
    if (updateData.validUntil) quotation.validUntil = updateData.validUntil;

    // Recalculate total
    quotation.total = quotation.subtotal + quotation.tax - quotation.discount;

    return quotation.save();
  }

  async delete(id: string): Promise<boolean> {
    const quotation = await this.quotationModel.findById(id).exec();
    if (!quotation) {
      throw new NotFoundException(`Cotización con ID ${id} no encontrada`);
    }

    // Can only delete draft quotations
    if (quotation.status !== QuotationStatus.DRAFT) {
      throw new BadRequestException('Solo se pueden eliminar cotizaciones en borrador');
    }

    await this.quotationModel.findByIdAndDelete(id).exec();
    return true;
  }

  async sendQuotation(id: string): Promise<any> {
    const quotation = await this.quotationModel.findById(id).exec();
    if (!quotation) {
      throw new NotFoundException(`Cotización con ID ${id} no encontrada`);
    }

    if (quotation.status !== QuotationStatus.DRAFT) {
      throw new BadRequestException('Solo se pueden enviar cotizaciones en borrador');
    }

    quotation.status = QuotationStatus.SENT;
    quotation.sentAt = new Date();

    return quotation.save();
  }

  async acceptQuotation(id: string): Promise<any> {
    const quotation = await this.quotationModel.findById(id).exec();
    if (!quotation) {
      throw new NotFoundException(`Cotización con ID ${id} no encontrada`);
    }

    if (quotation.status !== QuotationStatus.SENT) {
      throw new BadRequestException('Solo se pueden aceptar cotizaciones enviadas');
    }

    quotation.status = QuotationStatus.ACCEPTED;
    quotation.acceptedAt = new Date();

    return quotation.save();
  }

  async rejectQuotation(id: string): Promise<any> {
    const quotation = await this.quotationModel.findById(id).exec();
    if (!quotation) {
      throw new NotFoundException(`Cotización con ID ${id} no encontrada`);
    }

    if (quotation.status !== QuotationStatus.SENT) {
      throw new BadRequestException('Solo se pueden rechazar cotizaciones enviadas');
    }

    quotation.status = QuotationStatus.REJECTED;
    quotation.rejectedAt = new Date();

    return quotation.save();
  }

  async expireQuotations(): Promise<void> {
    const now = new Date();
    await this.quotationModel.updateMany(
      {
        status: QuotationStatus.SENT,
        validUntil: { $lt: now },
      },
      {
        status: QuotationStatus.EXPIRED,
      },
    ).exec();
  }

  async getQuotationsByCustomer(customerId: string): Promise<any[]> {
    return this.quotationModel
      .find({ customerId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async generatePdf(id: string): Promise<string> {
    const quotation = await this.findOne(id);
    const customer = await this.customerModel.findById(quotation.customerId).exec();

    if (!customer) {
      throw new NotFoundException('Cliente no encontrado');
    }

    // Map status to Spanish
    const statusMap = {
      [QuotationStatus.DRAFT]: 'Borrador',
      [QuotationStatus.SENT]: 'Enviada',
      [QuotationStatus.ACCEPTED]: 'Aceptada',
      [QuotationStatus.REJECTED]: 'Rechazada',
      [QuotationStatus.EXPIRED]: 'Vencida',
    };

    // Calculate validity days
    const validityDays = quotation.validUntil
      ? Math.ceil(
          (new Date(quotation.validUntil).getTime() - quotation.createdAt.getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 30;

    // Format dates
    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    const pdfData = {
      quotationNumber: quotation._id.toString().slice(-8).toUpperCase(),
      date: formatDate(quotation.createdAt),
      validUntil: quotation.validUntil ? formatDate(quotation.validUntil) : null,
      status: quotation.status,
      statusText: statusMap[quotation.status],
      companyName: 'Luxapatio',
      companyAddress: null,
      companyPhone: null,
      companyEmail: null,
      customer: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone || null,
        company: customer.company || null,
      },
      items: quotation.items.map((item) => ({
        productName: item.productName,
        productSku: item.productSku || null,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toFixed(2),
        total: item.total.toFixed(2),
        notes: item.notes || null,
      })),
      subtotal: quotation.subtotal.toFixed(2),
      tax: quotation.tax ? quotation.tax.toFixed(2) : null,
      discount: quotation.discount ? quotation.discount.toFixed(2) : null,
      total: quotation.total.toFixed(2),
      notes: quotation.notes || null,
      validityDays,
    };

    return this.pdfService.generatePdf('quotation.hbs', pdfData);
  }

  async convertQuotationToLead(
    quotationId: string,
    clientData: {
      clientName: string;
      clientEmail: string;
      clientPhone?: string;
      company?: string;
      message?: string;
    },
    userId: string,
  ): Promise<any> {
    // Find quotation
    const quotation = await this.quotationModel.findById(quotationId).exec();
    if (!quotation) {
      throw new NotFoundException(`Cotización con ID ${quotationId} no encontrada`);
    }

    // Check if quotation already has a lead
    if (quotation.leadId) {
      throw new BadRequestException('Esta cotización ya está vinculada a un lead');
    }

    // Find or create customer by email
    let customer = await this.customerModel.findOne({ email: clientData.clientEmail }).exec();

    if (!customer) {
      customer = new this.customerModel({
        name: clientData.clientName,
        email: clientData.clientEmail,
        phone: clientData.clientPhone,
        company: clientData.company,
      });
      await customer.save();
    }

    // Get the first product from quotation items
    const firstItem = quotation.items[0];
    if (!firstItem) {
      throw new BadRequestException('La cotización no tiene productos');
    }

    // Create lead
    const lead = new this.leadModel({
      productId: firstItem.productId,
      customerId: customer._id,
      clientName: clientData.clientName,
      clientEmail: clientData.clientEmail,
      clientPhone: clientData.clientPhone,
      message: clientData.message || `Lead creado desde cotización ${quotation._id.toString().slice(-8).toUpperCase()}`,
      status: LeadStatus.IN_PROGRESS,
      assignedTo: userId,
      assignedAt: new Date(),
    });

    const savedLead = await lead.save();

    // Update quotation with customer and lead
    quotation.customerId = customer._id as any;
    quotation.leadId = savedLead._id as any;
    await quotation.save();

    return savedLead;
  }
}
