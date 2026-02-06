import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Customer } from './schemas/customer.schema';
import { CustomerNote } from './schemas/customer-note.schema';

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(Customer.name) private customerModel: Model<Customer>,
    @InjectModel(CustomerNote.name) private customerNoteModel: Model<CustomerNote>,
  ) {}

  async findAll(): Promise<any[]> {
    return this.customerModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<any> {
    const customer = await this.customerModel.findById(id).exec();
    if (!customer) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }
    return customer;
  }

  async findByEmail(email: string): Promise<any> {
    return this.customerModel.findOne({ email }).exec();
  }

  async create(customerData: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
  }): Promise<any> {
    const customer = new this.customerModel(customerData);
    return customer.save();
  }

  async update(
    id: string,
    updateData: Partial<{
      name: string;
      email: string;
      phone: string;
      company: string;
    }>,
  ): Promise<any> {
    const customer = await this.customerModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true },
    ).exec();
    if (!customer) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }
    return customer;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.customerModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }
    // Also delete all notes for this customer
    await this.customerNoteModel.deleteMany({ customerId: id }).exec();
    return true;
  }

  // Notes management
  async createNote(
    customerId: string,
    content: string,
    createdBy: string,
    isImportant: boolean = false,
  ): Promise<any> {
    const customer = await this.customerModel.findById(customerId).exec();
    if (!customer) {
      throw new NotFoundException(`Cliente con ID ${customerId} no encontrado`);
    }

    const note = new this.customerNoteModel({
      customerId,
      content,
      createdBy,
      isImportant,
    });
    return note.save();
  }

  async getNotes(customerId: string): Promise<any[]> {
    return this.customerNoteModel
      .find({ customerId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateNote(
    noteId: string,
    content: string,
    isImportant?: boolean,
  ): Promise<any> {
    const updateData: any = { content };
    if (isImportant !== undefined) {
      updateData.isImportant = isImportant;
    }

    const note = await this.customerNoteModel.findByIdAndUpdate(
      noteId,
      updateData,
      { new: true },
    ).exec();
    if (!note) {
      throw new NotFoundException(`Nota con ID ${noteId} no encontrada`);
    }
    return note;
  }

  async deleteNote(noteId: string): Promise<boolean> {
    const result = await this.customerNoteModel.findByIdAndDelete(noteId).exec();
    if (!result) {
      throw new NotFoundException(`Nota con ID ${noteId} no encontrada`);
    }
    return true;
  }

  // Find or create customer (used when creating leads)
  async findOrCreate(email: string, name: string, phone?: string): Promise<any> {
    let customer = await this.findByEmail(email);
    if (!customer) {
      customer = await this.create({ name, email, phone });
    }
    return customer;
  }
}
