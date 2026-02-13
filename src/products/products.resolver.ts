import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/enums/permission.enum';

@Resolver(() => Product)
export class ProductsResolver {
  constructor(private readonly productsService: ProductsService) {}

  @Query(() => [Product], { name: 'products' })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.PRODUCTS_READ)
  async findAll(
    @Args('skip', { type: () => Int, nullable: true }) skip?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('search', { type: () => String, nullable: true }) search?: string,
  ): Promise<Product[]> {
    return this.productsService.findAll(skip, limit, search);
  }

  @Query(() => Int, { name: 'productsCount' })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.PRODUCTS_READ)
  async count(
    @Args('search', { type: () => String, nullable: true }) search?: string,
  ): Promise<number> {
    return this.productsService.count(search);
  }

  @Query(() => Product, { name: 'product', nullable: true })
  async findOne(@Args('id', { type: () => ID }) id: string): Promise<Product> {
    return this.productsService.findOne(id);
  }

  @Query(() => Product, { name: 'productBySku', nullable: true })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.PRODUCTS_READ)
  async findBySku(@Args('sku') sku: string): Promise<Product> {
    return this.productsService.findBySku(sku);
  }

  @Mutation(() => Product)
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.PRODUCTS_CREATE)
  async createProduct(
    @Args('input') input: CreateProductInput,
  ): Promise<Product> {
    return this.productsService.create(input);
  }

  @Mutation(() => Product)
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.PRODUCTS_UPDATE)
  async updateProduct(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateProductInput,
  ): Promise<Product> {
    return this.productsService.update(id, input);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.PRODUCTS_DELETE)
  async deleteProduct(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.productsService.delete(id);
  }

  @Mutation(() => Product)
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.PRODUCTS_UPDATE)
  async regenerateQR(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Product> {
    return this.productsService.regenerateQR(id);
  }

  @Mutation(() => Int)
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.PRODUCTS_UPDATE)
  async regenerateAllQRs(): Promise<number> {
    return this.productsService.regenerateAllQRs();
  }

  @Query(() => String, { name: 'qrLabelsPdf' })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.PRODUCTS_READ)
  async qrLabelsPdf(
    @Args('labelContent', { type: () => String, defaultValue: 'qr-name-bottom' })
    labelContent: string,
    @Args('ids', { type: () => [ID], nullable: true }) ids?: string[],
  ): Promise<string> {
    return this.productsService.generateQrLabelsPdf(labelContent, ids);
  }
}
