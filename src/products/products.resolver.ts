import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';

@Resolver(() => Product)
export class ProductsResolver {
  constructor(private readonly productsService: ProductsService) {}

  @Query(() => [Product], { name: 'products' })
  async findAll(
    @Args('skip', { type: () => Int, nullable: true }) skip?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<Product[]> {
    return this.productsService.findAll(skip, limit);
  }

  @Query(() => Product, { name: 'product', nullable: true })
  async findOne(@Args('id', { type: () => ID }) id: string): Promise<Product> {
    return this.productsService.findOne(id);
  }

  @Query(() => Product, { name: 'productBySku', nullable: true })
  async findBySku(@Args('sku') sku: string): Promise<Product> {
    return this.productsService.findBySku(sku);
  }

  @Mutation(() => Product)
  @UseGuards(GqlAuthGuard)
  async createProduct(
    @Args('input') input: CreateProductInput,
  ): Promise<Product> {
    return this.productsService.create(input);
  }

  @Mutation(() => Product)
  @UseGuards(GqlAuthGuard)
  async updateProduct(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateProductInput,
  ): Promise<Product> {
    return this.productsService.update(id, input);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async deleteProduct(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.productsService.delete(id);
  }
}
