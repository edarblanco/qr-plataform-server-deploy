import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from '../products/schemas/product.schema';
import { Parser } from 'json2csv';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

@Injectable()
export class CsvService {
  constructor(@InjectModel(Product.name) private productModel: Model<Product>) {}

  async exportToCSV(): Promise<string> {
    const products = await this.productModel.find().exec();
    const fields = [
      'name',
      'sku',
      'brand',
      'price',
      'stock',
      'description',
      'image',
    ];
    const parser = new Parser({ fields });
    return parser.parse(
      products.map((p) => ({
        name: p.name,
        sku: p.sku,
        brand: p.brand || '',
        price: p.price,
        stock: p.stock,
        description: p.description || '',
        image: p.image || '',
      })),
    );
  }

  async importFromCSV(fileContent: string): Promise<Product[]> {
    const products: any[] = [];

    return new Promise((resolve, reject) => {
      const stream = Readable.from(fileContent);
      stream
        .pipe(csvParser())
        .on('data', (row) => {
          // Validate and transform row data
          if (row.name && row.sku && row.price && row.stock) {
            products.push({
              name: row.name,
              sku: row.sku,
              brand: row.brand || null,
              price: parseFloat(row.price),
              stock: parseInt(row.stock, 10),
              description: row.description || null,
              image: row.image || null,
            });
          }
        })
        .on('end', async () => {
          try {
            // Insert products (skip duplicates based on SKU)
            const created: Product[] = [];
            for (const productData of products) {
              const existing = await this.productModel
                .findOne({ sku: productData.sku })
                .exec();
              if (!existing) {
                const product = new this.productModel(productData);
                const saved = await product.save();
                created.push(saved);
              }
            }
            resolve(created);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', reject);
    });
  }

  async exportLeadsToCSV(): Promise<string> {
    // This could be implemented to export leads as well
    // For now, we'll focus on products
    return '';
  }
}
