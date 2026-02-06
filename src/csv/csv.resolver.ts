import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CsvService } from './csv.service';
import { CSVExportResult } from './entities/csv-export-result.entity';
import { Product } from '../products/entities/product.entity';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/enums/permission.enum';

@Resolver()
export class CsvResolver {
  constructor(private readonly csvService: CsvService) {}

  @Query(() => CSVExportResult)
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.PRODUCTS_EXPORT)
  async exportCSV(): Promise<CSVExportResult> {
    const csvContent = await this.csvService.exportToCSV();
    const filename = `products_export_${Date.now()}.csv`;

    return {
      filename,
      url: `/exports/${filename}`, // This would need proper file serving setup
      content: csvContent,
    };
  }

  @Mutation(() => [Product])
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.PRODUCTS_IMPORT)
  async importCSV(
    @Args('csvContent', { type: () => String }) csvContent: string,
  ): Promise<Product[]> {
    const products = await this.csvService.importFromCSV(csvContent);
    return products.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      sku: p.sku,
      brand: p.brand,
      price: p.price,
      stock: p.stock,
      description: p.description,
      image: p.image,
      qrCode: p.qrCode,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
  }
}
