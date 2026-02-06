import { Resolver, Query, Mutation } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { SquareService } from './square.service';
import { ProductsService } from '../products/products.service';
import { SquareProduct } from './entities/square-product.entity';
import { Product } from '../products/entities/product.entity';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/enums/permission.enum';

@Resolver(() => SquareProduct)
export class SquareResolver {
  constructor(
    private readonly squareService: SquareService,
    private readonly productsService: ProductsService,
  ) {}

  @Query(() => [SquareProduct], { name: 'getSquareProducts' })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.PRODUCTS_READ)
  async getSquareProducts(): Promise<SquareProduct[]> {
    console.log('🔵 [RESOLVER] getSquareProducts called');
    const startTime = Date.now();

    const products = await this.squareService.getSquareProducts();

    const duration = Date.now() - startTime;
    console.log(
      `🔵 [RESOLVER] Returning ${products.length} products in ${duration}ms`,
    );

    return products;
  }

  @Mutation(() => [Product], { name: 'importProductsFromSquare' })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.PRODUCTS_IMPORT)
  async importProductsFromSquare(): Promise<Product[]> {
    console.log('🔵 [RESOLVER] importProductsFromSquare called');
    const startTime = Date.now();

    // 1. Get products from Square
    const squareProducts = await this.squareService.getSquareProducts();

    // 2. Import each product to our database
    const importedProducts: Product[] = [];

    for (const sqProduct of squareProducts) {
      try {
        // Check if product already exists by SKU
        let existingProduct;
        try {
          existingProduct = await this.productsService.findBySku(
            sqProduct.sku,
          );
        } catch (error) {
          // Product doesn't exist, we can create it
          existingProduct = null;
        }

        if (!existingProduct) {
          // Create new product
          const createdProduct = await this.productsService.create({
            name: sqProduct.name,
            sku: sqProduct.sku,
            brand: sqProduct.brand,
            price: sqProduct.price,
            stock: sqProduct.stock,
            description: sqProduct.description,
            image: sqProduct.image,
          });

          importedProducts.push({
            id: createdProduct._id.toString(),
            name: createdProduct.name,
            sku: createdProduct.sku,
            brand: createdProduct.brand,
            price: createdProduct.price,
            stock: createdProduct.stock,
            description: createdProduct.description,
            image: createdProduct.image,
            qrCode: createdProduct.qrCode,
            createdAt: createdProduct.createdAt,
            updatedAt: createdProduct.updatedAt,
          });
        }
      } catch (error) {
        console.error(`Error importing product ${sqProduct.name}:`, error);
      }
    }

    const duration = Date.now() - startTime;
    console.log(
      `🔵 [RESOLVER] Imported ${importedProducts.length} new products in ${duration}ms`,
    );

    return importedProducts;
  }
}
