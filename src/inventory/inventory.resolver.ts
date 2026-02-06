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
import { InventoryService } from './inventory.service';
import { ProductsService } from '../products/products.service';
import { InventoryLog } from './entities/inventory-log.entity';
import { Product } from '../products/entities/product.entity';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/enums/permission.enum';

@Resolver(() => InventoryLog)
export class InventoryResolver {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly productsService: ProductsService,
  ) {}

  @Query(() => [InventoryLog], { name: 'inventoryLogs' })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.INVENTORY_READ)
  async findLogs(
    @Args('productId', { type: () => String, nullable: true })
    productId?: string,
    @Args('skip', { type: () => Int, nullable: true }) skip?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<InventoryLog[]> {
    return this.inventoryService.findLogs(productId, skip, limit);
  }

  @Query(() => InventoryLog, { name: 'inventoryLog', nullable: true })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.INVENTORY_READ)
  async findOne(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<InventoryLog> {
    return this.inventoryService.findOne(id);
  }

  @Mutation(() => Product)
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.INVENTORY_ROLLBACK)
  async rollbackProduct(
    @Args('logId', { type: () => ID }) logId: string,
  ): Promise<Product> {
    const product = await this.inventoryService.rollback(logId);
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

  // Field resolver to load related product
  @ResolveField(() => Product, { nullable: true })
  async product(@Parent() log: InventoryLog): Promise<Product | null> {
    try {
      const product = await this.productsService.findOne(log.productId);
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
    } catch (error) {
      return null; // Product may have been deleted
    }
  }
}
