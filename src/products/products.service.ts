import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { Product } from './schemas/product.schema';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';
import { QrService } from '../qr/qr.service';
import { PdfService } from '../pdf/pdf.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    private readonly qrService: QrService,
    private readonly configService: ConfigService,
    private readonly pdfService: PdfService,
  ) {}

  async findAll(skip = 0, limit?: number): Promise<Product[]> {
    const query = this.productModel.find().sort({ name: 1 }).skip(skip);
    if (limit != null && limit > 0) query.limit(limit);
    return query.exec();
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }
    return product;
  }

  async findBySku(sku: string): Promise<Product> {
    const product = await this.productModel.findOne({ sku }).exec();
    if (!product) {
      throw new NotFoundException(`Producto con SKU ${sku} no encontrado`);
    }
    return product;
  }

  async create(
    input: CreateProductInput,
    adminId?: string,
  ): Promise<Product> {
    const product = new this.productModel(input);

    // Generar QR code
    const frontendUrl =
      this.configService.get('BASE_URL') || 'http://localhost:5173';
    const qrUrl = `${frontendUrl}/product/${product._id}`;
    const qrCode = await this.qrService.generateQR(qrUrl);
    product.qrCode = qrCode;

    const savedProduct = await product.save();

    return savedProduct;
  }

  async update(
    id: string,
    input: UpdateProductInput,
    adminId?: string,
  ): Promise<Product> {
    const product = await this.findOne(id);

    Object.assign(product, input);
    return product.save();
  }

  async delete(id: string, adminId?: string): Promise<boolean> {
    const product = await this.findOne(id);

    await this.productModel.findByIdAndDelete(id).exec();
    return true;
  }

  async count(): Promise<number> {
    return this.productModel.countDocuments().exec();
  }

  async regenerateQR(id: string): Promise<Product> {
    const product = await this.findOne(id);

    // Regenerar QR code con la URL actual
    const frontendUrl =
      this.configService.get('BASE_URL') || 'http://localhost:5173';
    const qrUrl = `${frontendUrl}/product/${product._id}`;
    const qrCode = await this.qrService.generateQR(qrUrl);

    product.qrCode = qrCode;
    return product.save();
  }

  async regenerateAllQRs(): Promise<number> {
    const frontendUrl =
      this.configService.get('BASE_URL') || 'http://localhost:5173';

    const products = await this.productModel.find().exec();
    const BATCH = 20;
    let count = 0;

    for (let i = 0; i < products.length; i += BATCH) {
      const batch = products.slice(i, i + BATCH);
      await Promise.all(
        batch.map(async (product) => {
          const qrUrl = `${frontendUrl}/product/${product._id}`;
          product.qrCode = await this.qrService.generateQR(qrUrl);
          await product.save();
          count++;
        }),
      );
    }

    return count;
  }

  async generateQrLabelsPdf(labelContent: string, ids?: string[]): Promise<string> {
    let products: Product[];

    if (ids && ids.length > 0) {
      // Filter by provided IDs
      products = await this.productModel.find({ _id: { $in: ids } }).sort({ name: 1 }).exec();
    } else {
      // Default: fetch all
      products = await this.findAll();
    }

    const isOnly = labelContent === 'qr-only';
    const isSku  = labelContent === 'qr-name-sku';

    const data = {
      products: products.map((p) => ({
        name: p.name,
        sku:  p.sku,
        qrCode: p.qrCode ?? null,
      })),
      showNameTop:    labelContent === 'qr-name-top',
      showNameBottom: labelContent === 'qr-name-bottom' || isSku,
      showSku:        isSku,
      qrSize:         isOnly ? '1.3in' : isSku ? '0.92in' : '1.08in',
      nameFontSize:   isSku ? '5.5pt' : '6pt',
    };

    return this.pdfService.generatePdf('qr-labels.hbs', data, {
      preferCSSPageSize: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      waitUntil: 'load',
    });
  }
}
