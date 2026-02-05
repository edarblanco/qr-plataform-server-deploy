import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { Product } from './schemas/product.schema';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';
import { QrService } from '../qr/qr.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    private readonly qrService: QrService,
    private readonly configService: ConfigService,
  ) {}

  async findAll(skip = 0, limit = 50): Promise<Product[]> {
    return this.productModel
      .find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
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
      this.configService.get('FRONTEND_URL') || 'http://localhost:5173';
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
}
