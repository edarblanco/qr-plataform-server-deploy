import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  Int,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { ProductsService } from '../products/products.service';
import { Lead } from './entities/lead.entity';
import { Product } from '../products/entities/product.entity';
import { CreateLeadInput } from './dto/create-lead.input';
import { UpdateLeadInput } from './dto/update-lead.input';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { LeadStatus } from './schemas/lead.schema';

@Resolver(() => Lead)
export class LeadsResolver {
  constructor(
    private readonly leadsService: LeadsService,
    private readonly productsService: ProductsService,
  ) {}

  @Query(() => [Lead], { name: 'leads' })
  @UseGuards(GqlAuthGuard)
  async findAll(
    @Args('status', { type: () => LeadStatus, nullable: true })
    status?: LeadStatus,
    @Args('skip', { type: () => Int, nullable: true }) skip?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<Lead[]> {
    return this.leadsService.findAll(status, skip, limit);
  }

  @Query(() => Lead, { name: 'lead', nullable: true })
  @UseGuards(GqlAuthGuard)
  async findOne(@Args('id', { type: () => ID }) id: string): Promise<Lead> {
    return this.leadsService.findOne(id);
  }

  @Mutation(() => Lead)
  async createLead(@Args('input') input: CreateLeadInput): Promise<Lead> {
    return this.leadsService.create(input);
  }

  @Mutation(() => Lead)
  @UseGuards(GqlAuthGuard)
  async updateLead(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateLeadInput,
  ): Promise<Lead> {
    return this.leadsService.update(id, input);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async deleteLead(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    return this.leadsService.delete(id);
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
