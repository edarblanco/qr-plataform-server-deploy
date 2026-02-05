import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InventoryService } from './inventory.service';
import { InventoryResolver } from './inventory.resolver';
import {
  InventoryLog,
  InventoryLogSchema,
} from './schemas/inventory-log.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InventoryLog.name, schema: InventoryLogSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
    ProductsModule,
  ],
  providers: [InventoryService, InventoryResolver],
  exports: [InventoryService],
})
export class InventoryModule {}
