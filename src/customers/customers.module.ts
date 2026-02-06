import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomersService } from './customers.service';
import { CustomersResolver } from './customers.resolver';
import { Customer, CustomerSchema } from './schemas/customer.schema';
import { CustomerNote, CustomerNoteSchema } from './schemas/customer-note.schema';
import { Lead, LeadSchema } from '../leads/schemas/lead.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Customer.name, schema: CustomerSchema },
      { name: CustomerNote.name, schema: CustomerNoteSchema },
      { name: Lead.name, schema: LeadSchema },
    ]),
  ],
  providers: [CustomersService, CustomersResolver],
  exports: [CustomersService],
})
export class CustomersModule {}
