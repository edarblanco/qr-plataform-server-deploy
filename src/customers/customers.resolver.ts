import { Resolver, Query, Mutation, Args, ID, Context, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { Customer, CustomerStats } from './entities/customer.entity';
import { CustomerNote } from './entities/customer-note.entity';
import { CreateCustomerInput } from './dto/create-customer.input';
import { UpdateCustomerInput } from './dto/update-customer.input';
import { CreateNoteInput } from './dto/create-note.input';
import { UpdateNoteInput } from './dto/update-note.input';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/enums/permission.enum';
import { InjectModel } from '@nestjs/mongoose';
import { Lead } from '../leads/schemas/lead.schema';
import { Model } from 'mongoose';

@Resolver(() => Customer)
export class CustomersResolver {
  constructor(
    private readonly customersService: CustomersService,
    @InjectModel(Lead.name) private leadModel: Model<Lead>,
  ) {}

  @Query(() => [Customer], { name: 'customers' })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.LEADS_READ)
  async findAll(): Promise<Customer[]> {
    const customers = await this.customersService.findAll();
    return customers.map(customer => ({
      id: customer._id.toString(),
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      company: customer.company,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    }));
  }

  @Query(() => Customer, { name: 'customer', nullable: true })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.LEADS_READ)
  async findOne(@Args('id', { type: () => ID }) id: string): Promise<Customer> {
    const customer = await this.customersService.findOne(id);
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

  @Mutation(() => Customer)
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.LEADS_CREATE)
  async createCustomer(@Args('input') input: CreateCustomerInput): Promise<Customer> {
    const customer = await this.customersService.create(input);
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

  @Mutation(() => Customer)
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.LEADS_UPDATE)
  async updateCustomer(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateCustomerInput,
  ): Promise<Customer> {
    const customer = await this.customersService.update(id, input);
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

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.LEADS_DELETE)
  async deleteCustomer(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    return this.customersService.delete(id);
  }

  // Notes
  @Mutation(() => CustomerNote)
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.LEADS_CREATE)
  async createCustomerNote(
    @Args('input') input: CreateNoteInput,
    @Context() context,
  ): Promise<CustomerNote> {
    const userId = context.req.user._id.toString();
    const note = await this.customersService.createNote(
      input.customerId,
      input.content,
      userId,
      input.isImportant,
    );
    return {
      id: note._id.toString(),
      customerId: note.customerId,
      createdBy: note.createdBy,
      content: note.content,
      isImportant: note.isImportant,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    };
  }

  @Mutation(() => CustomerNote)
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.LEADS_UPDATE)
  async updateCustomerNote(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateNoteInput,
  ): Promise<CustomerNote> {
    const note = await this.customersService.updateNote(id, input.content, input.isImportant);
    return {
      id: note._id.toString(),
      customerId: note.customerId,
      createdBy: note.createdBy,
      content: note.content,
      isImportant: note.isImportant,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    };
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.LEADS_DELETE)
  async deleteCustomerNote(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    return this.customersService.deleteNote(id);
  }

  // Field resolvers
  @ResolveField(() => [Lead])
  async leads(@Parent() customer: Customer) {
    const leads = await this.leadModel
      .find({ customerId: customer.id })
      .sort({ createdAt: -1 })
      .exec();
    return leads.map(lead => ({
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
    }));
  }

  @ResolveField(() => [CustomerNote])
  async notes(@Parent() customer: Customer) {
    const notes = await this.customersService.getNotes(customer.id);
    return notes.map(note => ({
      id: note._id.toString(),
      customerId: note.customerId,
      createdBy: note.createdBy,
      content: note.content,
      isImportant: note.isImportant,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    }));
  }

  @ResolveField(() => CustomerStats)
  async stats(@Parent() customer: Customer) {
    const leads = await this.leadModel
      .find({ customerId: customer.id })
      .exec();

    return {
      totalLeads: leads.length,
      totalQuotations: 0, // TODO: implement when quotations are ready
      acceptedQuotations: 0, // TODO: implement when quotations are ready
      lastActivityDate: leads.length > 0 ? leads[0].createdAt : null,
    };
  }
}
