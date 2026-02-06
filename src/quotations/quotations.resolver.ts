import { Resolver, Query, Mutation, Args, ID, Context, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { QuotationsService } from './quotations.service';
import { Quotation, QuotationItem } from './entities/quotation.entity';
import { CreateQuotationInput } from './dto/create-quotation.input';
import { UpdateQuotationInput } from './dto/update-quotation.input';
import { ConvertQuotationToLeadInput } from './dto/convert-quotation-to-lead.input';
import { QuotationStatus } from './schemas/quotation.schema';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/enums/permission.enum';
import { InjectModel } from '@nestjs/mongoose';
import { Customer } from '../customers/schemas/customer.schema';
import { Lead as LeadSchema } from '../leads/schemas/lead.schema';
import { Lead } from '../leads/entities/lead.entity';
import { User } from '../users/schemas/user.schema';
import { Product } from '../products/schemas/product.schema';
import { Model } from 'mongoose';

@Resolver(() => Quotation)
export class QuotationsResolver {
  constructor(
    private readonly quotationsService: QuotationsService,
    @InjectModel(Customer.name) private customerModel: Model<Customer>,
    @InjectModel(LeadSchema.name) private leadModel: Model<LeadSchema>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Product.name) private productModel: Model<Product>,
  ) {}

  @Query(() => [Quotation], { name: 'quotations' })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.LEADS_READ)
  async findAll(
    @Args('status', { type: () => String, nullable: true }) status?: QuotationStatus,
    @Args('customerId', { type: () => ID, nullable: true }) customerId?: string,
    @Args('createdBy', { type: () => ID, nullable: true }) createdBy?: string,
  ): Promise<Quotation[]> {
    const quotations = await this.quotationsService.findAll({
      status,
      customerId,
      createdBy,
    });
    return this.mapQuotations(quotations);
  }

  @Query(() => Quotation, { name: 'quotation', nullable: true })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.LEADS_READ)
  async findOne(@Args('id', { type: () => ID }) id: string): Promise<Quotation> {
    const quotation = await this.quotationsService.findOne(id);
    return this.mapQuotation(quotation);
  }

  @Mutation(() => Quotation)
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.LEADS_CREATE)
  async createQuotation(
    @Args('input') input: CreateQuotationInput,
    @Context() context,
  ): Promise<Quotation> {
    const userId = context.req.user._id.toString();
    const quotation = await this.quotationsService.create({
      ...input,
      createdBy: userId,
    });
    return this.mapQuotation(quotation);
  }

  @Mutation(() => Quotation)
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.LEADS_UPDATE)
  async updateQuotation(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateQuotationInput,
  ): Promise<Quotation> {
    const quotation = await this.quotationsService.update(id, input);
    return this.mapQuotation(quotation);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.LEADS_DELETE)
  async deleteQuotation(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    return this.quotationsService.delete(id);
  }

  @Mutation(() => Quotation)
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.LEADS_UPDATE)
  async sendQuotation(@Args('id', { type: () => ID }) id: string): Promise<Quotation> {
    const quotation = await this.quotationsService.sendQuotation(id);
    return this.mapQuotation(quotation);
  }

  @Mutation(() => Quotation)
  async acceptQuotation(@Args('id', { type: () => ID }) id: string): Promise<Quotation> {
    const quotation = await this.quotationsService.acceptQuotation(id);
    return this.mapQuotation(quotation);
  }

  @Mutation(() => Quotation)
  async rejectQuotation(@Args('id', { type: () => ID }) id: string): Promise<Quotation> {
    const quotation = await this.quotationsService.rejectQuotation(id);
    return this.mapQuotation(quotation);
  }

  @Mutation(() => Lead)
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.LEADS_CREATE)
  async convertQuotationToLead(
    @Args('input') input: ConvertQuotationToLeadInput,
    @Context() context,
  ): Promise<Lead> {
    const userId = context.req.user._id.toString();
    const lead = await this.quotationsService.convertQuotationToLead(
      input.quotationId,
      {
        clientName: input.clientName,
        clientEmail: input.clientEmail,
        clientPhone: input.clientPhone,
        company: input.company,
        message: input.message,
      },
      userId,
    );

    // Map lead to GraphQL entity
    return {
      id: lead._id.toString(),
      productId: lead.productId,
      customerId: lead.customerId,
      clientName: lead.clientName,
      clientEmail: lead.clientEmail,
      clientPhone: lead.clientPhone,
      message: lead.message,
      status: lead.status,
      assignedTo: lead.assignedTo,
      queuePosition: lead.queuePosition,
      priority: lead.priority,
      assignedAt: lead.assignedAt,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
    };
  }

  @Query(() => String, { name: 'quotationPdf' })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.LEADS_READ)
  async generateQuotationPdf(@Args('id', { type: () => ID }) id: string): Promise<string> {
    return this.quotationsService.generatePdf(id);
  }

  // Field resolvers
  @ResolveField('customer')
  async customer(@Parent() quotation: Quotation) {
    const customer = await this.customerModel.findById(quotation.customerId).exec();
    if (!customer) return null;
    return {
      id: customer._id.toString(),
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      company: customer.company,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }

  @ResolveField('lead')
  async lead(@Parent() quotation: Quotation) {
    if (!quotation.leadId) return null;
    const lead = await this.leadModel.findById(quotation.leadId).exec();
    if (!lead) return null;
    return {
      id: lead._id.toString(),
      productId: lead.productId,
      customerId: lead.customerId,
      clientName: lead.clientName,
      clientEmail: lead.clientEmail,
      clientPhone: lead.clientPhone,
      message: lead.message,
      status: lead.status,
      assignedTo: lead.assignedTo,
      queuePosition: lead.queuePosition,
      priority: lead.priority,
      assignedAt: lead.assignedAt,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
    };
  }

  @ResolveField('createdByUser')
  async createdByUser(@Parent() quotation: Quotation) {
    const user = await this.userModel.findById(quotation.createdBy).select('-password').exec();
    if (!user) return null;
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      availability: user.availability,
      createdAt: user.createdAt,
    };
  }

  // Helper methods
  private mapQuotation(quotation: any): Quotation {
    return {
      id: quotation._id.toString(),
      customerId: quotation.customerId,
      leadId: quotation.leadId,
      createdBy: quotation.createdBy,
      status: quotation.status,
      items: quotation.items,
      subtotal: quotation.subtotal,
      tax: quotation.tax,
      discount: quotation.discount,
      total: quotation.total,
      notes: quotation.notes,
      validUntil: quotation.validUntil,
      sentAt: quotation.sentAt,
      acceptedAt: quotation.acceptedAt,
      rejectedAt: quotation.rejectedAt,
      createdAt: quotation.createdAt,
      updatedAt: quotation.updatedAt,
    };
  }

  private mapQuotations(quotations: any[]): Quotation[] {
    return quotations.map(q => this.mapQuotation(q));
  }
}

@Resolver(() => QuotationItem)
export class QuotationItemResolver {
  constructor(@InjectModel(Product.name) private productModel: Model<Product>) {}

  @ResolveField('product')
  async product(@Parent() item: QuotationItem) {
    const product = await this.productModel.findById(item.productId).exec();
    if (!product) return null;
    return {
      id: product._id.toString(),
      name: product.name,
      sku: product.sku,
      price: product.price,
      stock: product.stock,
      image: product.image,
      qrCode: product.qrCode,
      brand: product.brand,
      description: product.description,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
