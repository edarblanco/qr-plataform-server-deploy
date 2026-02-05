import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CsvService } from './csv.service';
import { CsvResolver } from './csv.resolver';
import { Product, ProductSchema } from '../products/schemas/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
  ],
  providers: [CsvService, CsvResolver],
  exports: [CsvService],
})
export class CsvModule {}
