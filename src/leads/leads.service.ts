import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Lead, LeadStatus } from './schemas/lead.schema';
import { CreateLeadInput } from './dto/create-lead.input';
import { UpdateLeadInput } from './dto/update-lead.input';
import { ProductsService } from '../products/products.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class LeadsService {
  constructor(
    @InjectModel(Lead.name) private leadModel: Model<Lead>,
    private readonly productsService: ProductsService,
    private readonly emailService: EmailService,
  ) {}

  async findAll(
    status?: LeadStatus,
    skip = 0,
    limit = 50,
  ): Promise<Lead[]> {
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
    // Verify product exists
    const product = await this.productsService.findOne(input.productId);

    const lead = new this.leadModel({
      ...input,
      status: LeadStatus.NEW,
    });

    const savedLead = await lead.save();

    // Send email notification to admin (async, no await to not block)
    this.emailService
      .sendLeadNotification(
        {
          clientName: savedLead.clientName,
          clientEmail: savedLead.clientEmail,
          clientPhone: savedLead.clientPhone,
          message: savedLead.message,
        },
        {
          name: product.name,
          sku: product.sku,
          brand: product.brand,
          price: product.price,
        },
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
}
