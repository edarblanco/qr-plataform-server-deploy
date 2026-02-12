import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Lead, LeadStatus } from './schemas/lead.schema';
import { CreateLeadInput } from './dto/create-lead.input';
import { UpdateLeadInput } from './dto/update-lead.input';
import { ProductsService } from '../products/products.service';
import { EmailService } from '../email/email.service';
import { CustomersService } from '../customers/customers.service';
import { LeadAssignmentService } from './lead-assignment.service';

@Injectable()
export class LeadsService {
  constructor(
    @InjectModel(Lead.name) private leadModel: Model<Lead>,
    private readonly productsService: ProductsService,
    private readonly emailService: EmailService,
    private readonly customersService: CustomersService,
    private readonly leadAssignmentService: LeadAssignmentService,
  ) {}

  async findAll(status?: LeadStatus, skip = 0, limit = 50): Promise<Lead[]> {
    const query = status ? { status } : {};
    return this.leadModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async findOne(id: string): Promise<Lead> {
    const lead = await this.leadModel.findById(id).exec();
    if (!lead) {
      throw new NotFoundException(`Lead con ID ${id} no encontrado`);
    }
    return lead;
  }

  async create(input: CreateLeadInput): Promise<Lead> {
    // Validar que tenga al menos un producto (nuevo formato o legacy)
    if (!input.productId && (!input.items || input.items.length === 0)) {
      throw new NotFoundException(
        'Debe proporcionar al menos un producto (productId o items)',
      );
    }

    let productForNotification: any;
    let description = input.description;

    // Modo legacy: un solo producto (compatibilidad retroactiva)
    if (input.productId && !input.items) {
      const product = await this.productsService.findOne(input.productId);
      productForNotification = product;

      // Convertir a nuevo formato internamente
      input.items = [
        {
          productId: input.productId,
          productName: product.name,
          productSku: product.sku,
          productBrand: product.brand,
          productPrice: product.price,
        },
      ];

      description = `Cotización: ${product.name}`;
    } else if (input.items && input.items.length > 0) {
      // Modo nuevo: múltiples productos del carrito
      // Validar que todos los productos existan
      for (const item of input.items) {
        await this.productsService.findOne(item.productId);
      }

      // Preparar información para notificaciones
      const totalValue = input.items.reduce(
        (sum, i) => sum + i.productPrice,
        0,
      );
      productForNotification = {
        name: `${input.items.length} producto(s)`,
        sku: input.items.map((i) => i.productSku).join(', '),
        brand: '',
        price: totalValue,
      };

      if (!description) {
        if (input.items.length === 1) {
          description = `Cotización: ${input.items[0].productName}`;
        } else {
          description = `Cotización de ${input.items.length} productos`;
        }
      }
    }

    // Find or create customer
    const customer = await this.customersService.findOrCreate(
      input.clientEmail,
      input.clientName,
      input.clientPhone,
    );

    const lead = new this.leadModel({
      ...input,
      description,
      customerId: customer._id.toString(),
      status: LeadStatus.PENDING,
      priority: 0, // Default priority
    });

    const savedLead = await lead.save();

    // Notify all admins about new lead (async, no await to not block)
    this.leadAssignmentService
      .notifyAdminsNewLead(savedLead, productForNotification.name)
      .catch((err) =>
        console.error('Error notifying admins about new lead:', err),
      );

    // Try to assign to available vendedor (async)
    this.leadAssignmentService
      .assignLeadToVendedor(savedLead._id.toString())
      .catch((err) => console.error('Error assigning lead:', err));

    // Send email notification to admin (async, no await to not block)
    this.emailService
      .sendLeadNotification(
        {
          clientName: savedLead.clientName,
          clientEmail: savedLead.clientEmail,
          clientPhone: savedLead.clientPhone,
          message: savedLead.message,
        },
        productForNotification,
      )
      .catch((err) => console.error('Error sending lead notification:', err));

    return savedLead;
  }

  async update(id: string, input: UpdateLeadInput): Promise<Lead> {
    const lead = await this.findOne(id);

    if (input.status) {
      lead.status = input.status;
    }

    return lead.save();
  }

  async delete(id: string): Promise<boolean> {
    await this.findOne(id);
    await this.leadModel.findByIdAndDelete(id).exec();
    return true;
  }

  async count(status?: LeadStatus): Promise<number> {
    const query = status ? { status } : {};
    return this.leadModel.countDocuments(query).exec();
  }

  async findByProduct(productId: string): Promise<Lead[]> {
    return this.leadModel.find({ productId }).sort({ createdAt: -1 }).exec();
  }

  async findByVendedor(vendedorId: string): Promise<Lead[]> {
    return this.leadModel
      .find({ assignedTo: vendedorId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async startWorking(leadId: string, vendedorId: string): Promise<Lead> {
    const lead = await this.findOne(leadId);

    // Verify the lead is assigned to this vendedor
    if (lead.assignedTo !== vendedorId) {
      throw new NotFoundException('Lead no asignado a este vendedor');
    }

    if (lead.status !== LeadStatus.ASSIGNED) {
      throw new NotFoundException('Lead debe estar en estado ASSIGNED');
    }

    lead.status = LeadStatus.IN_PROGRESS;
    return lead.save();
  }

  async completeLead(leadId: string, vendedorId: string): Promise<Lead> {
    const lead = await this.findOne(leadId);

    // Verify the lead is assigned to this vendedor
    if (lead.assignedTo !== vendedorId) {
      throw new NotFoundException('Lead no asignado a este vendedor');
    }

    if (lead.status !== LeadStatus.IN_PROGRESS) {
      throw new NotFoundException('Lead debe estar en estado IN_PROGRESS');
    }

    lead.status = LeadStatus.COMPLETED;
    return lead.save();
  }

  async rejectLead(leadId: string, vendedorId: string): Promise<Lead> {
    const lead = await this.findOne(leadId);

    // Verify the lead is assigned to this vendedor
    if (lead.assignedTo !== vendedorId) {
      throw new NotFoundException('Lead no asignado a este vendedor');
    }

    if (
      lead.status !== LeadStatus.ASSIGNED &&
      lead.status !== LeadStatus.IN_PROGRESS
    ) {
      throw new NotFoundException(
        'Lead debe estar en estado ASSIGNED o IN_PROGRESS',
      );
    }

    lead.status = LeadStatus.REJECTED;
    return lead.save();
  }

  async reassignLead(leadId: string, newVendedorId?: string): Promise<boolean> {
    return this.leadAssignmentService.reassignLead(leadId, newVendedorId);
  }

  async getQueueStats() {
    return this.leadAssignmentService.getQueueStats();
  }
}
