import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InventoryLog } from './schemas/inventory-log.schema';
import { Product } from '../products/schemas/product.schema';

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(InventoryLog.name)
    private inventoryLogModel: Model<InventoryLog>,
    @InjectModel(Product.name) private productModel: Model<Product>,
  ) {}

  async logAction(
    productId: string,
    adminId: string,
    action: string,
    snapshot: any,
  ): Promise<InventoryLog> {
    const log = new this.inventoryLogModel({
      productId,
      adminId,
      action,
      snapshot,
    });
    return log.save();
  }

  async findLogs(
    productId?: string,
    skip = 0,
    limit = 50,
  ): Promise<InventoryLog[]> {
    const query = productId ? { productId } : {};
    return this.inventoryLogModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async findOne(id: string): Promise<InventoryLog> {
    const log = await this.inventoryLogModel.findById(id).exec();
    if (!log) {
      throw new NotFoundException(`Log con ID ${id} no encontrado`);
    }
    return log;
  }

  async rollback(logId: string): Promise<Product> {
    const log = await this.inventoryLogModel.findById(logId).exec();
    if (!log) {
      throw new NotFoundException(`Log con ID ${logId} no encontrado`);
    }

    const { productId, snapshot } = log;

    // Restaurar producto al estado del snapshot
    const product = await this.productModel
      .findByIdAndUpdate(productId, snapshot, { new: true, upsert: true })
      .exec();

    // Registrar el rollback
    await this.logAction(productId, 'system', 'ROLLBACK', snapshot);

    return product;
  }

  async countLogs(productId?: string): Promise<number> {
    const query = productId ? { productId } : {};
    return this.inventoryLogModel.countDocuments(query).exec();
  }
}
