import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  Int,
  Float,
  ObjectType,
  Field,
  ResolveField,
  Parent,
  Context,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { LeadsService } from './leads.service';
import { ProductsService } from '../products/products.service';
import { Lead } from './entities/lead.entity';
import { Product } from '../products/entities/product.entity';
import { CreateLeadInput } from './dto/create-lead.input';
import { UpdateLeadInput } from './dto/update-lead.input';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/enums/permission.enum';
import { LeadStatus } from './schemas/lead.schema';
import { LeadAssignmentService } from './lead-assignment.service';

@ObjectType()
export class QueueStats {
  @Field(() => Int)
  totalInQueue: number;

  @Field(() => Float)
  averageWaitTime: number;

  @Field({ nullable: true })
  oldestLead?: Date;
}

@Resolver(() => Lead)
export class LeadsResolver {
  constructor(
    private readonly leadsService: LeadsService,
    private readonly productsService: ProductsService,
    private readonly leadAssignmentService: LeadAssignmentService,
  ) {}

  @Query(() => [Lead], { name: 'leads' })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.LEADS_READ)
  async findAll(
    @Args('status', { type: () => LeadStatus, nullable: true })
    status?: LeadStatus,
    @Args('skip', { type: () => Int, nullable: true }) skip?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<Lead[]> {
    return this.leadsService.findAll(status, skip, limit);
  }

  @Query(() => Lead, { name: 'lead', nullable: true })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.LEADS_READ)
  async findOne(@Args('id', { type: () => ID }) id: string): Promise<Lead> {
    return this.leadsService.findOne(id);
  }

  @Mutation(() => Lead)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute for public endpoint
  async createLead(@Args('input') input: CreateLeadInput): Promise<Lead> {
    // Public endpoint - no authentication required (QR scan)
    // Rate limited to prevent abuse from QR codes
    return this.leadsService.create(input);
  }

  @Mutation(() => Lead)
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.LEADS_UPDATE)
  async updateLead(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateLeadInput,
  ): Promise<Lead> {
    return this.leadsService.update(id, input);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.LEADS_DELETE)
  async deleteLead(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    return this.leadsService.delete(id);
  }

  @Query(() => [Lead], { name: 'myAssignedLeads' })
  @UseGuards(GqlAuthGuard)
  async getMyAssignedLeads(@Context() context): Promise<Lead[]> {
    const vendedorId = context.req.user._id.toString();
    return this.leadsService.findByVendedor(vendedorId);
  }

  @Query(() => QueueStats, { name: 'queueStats' })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.LEADS_READ)
  async getQueueStats(): Promise<QueueStats> {
    return this.leadsService.getQueueStats();
  }

  @Mutation(() => Lead)
  @UseGuards(GqlAuthGuard)
  async startWorkingOnLead(
    @Args('id', { type: () => ID }) id: string,
    @Context() context,
  ): Promise<Lead> {
    const vendedorId = context.req.user._id.toString();
    return this.leadsService.startWorking(id, vendedorId);
  }

  @Mutation(() => Lead)
  @UseGuards(GqlAuthGuard)
  async completeLead(
    @Args('id', { type: () => ID }) id: string,
    @Context() context,
  ): Promise<Lead> {
    const vendedorId = context.req.user._id.toString();
    return this.leadsService.completeLead(id, vendedorId);
  }

  @Mutation(() => Lead)
  @UseGuards(GqlAuthGuard)
  async rejectLead(
    @Args('id', { type: () => ID }) id: string,
    @Context() context,
  ): Promise<Lead> {
    const vendedorId = context.req.user._id.toString();
    return this.leadsService.rejectLead(id, vendedorId);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.LEADS_UPDATE)
  async reassignLead(
    @Args('id', { type: () => ID }) id: string,
    @Args('newVendedorId', { type: () => ID, nullable: true }) newVendedorId?: string,
  ): Promise<boolean> {
    return this.leadsService.reassignLead(id, newVendedorId);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.LEADS_UPDATE)
  async processLeadQueue(): Promise<boolean> {
    await this.leadAssignmentService.processQueue();
    return true;
  }

  // Field resolver to load related product
  @ResolveField(() => Product)
  async product(@Parent() lead: Lead): Promise<Product> {
    const product = await this.productsService.findOne(lead.productId);
    return {
      id: product._id.toString(),
      name: product.name,
      sku: product.sku,
      brand: product.brand,
      price: product.price,
      stock: product.stock,
      description: product.description,
      image: product.image,
      qrCode: product.qrCode,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
