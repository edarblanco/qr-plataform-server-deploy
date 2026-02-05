import { Module } from '@nestjs/common';
import { SquareService } from './square.service';
import { SquareResolver } from './square.resolver';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [ProductsModule],
  providers: [SquareService, SquareResolver],
  exports: [SquareService],
})
export class SquareModule {}
