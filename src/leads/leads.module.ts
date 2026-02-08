import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeadsService } from './leads.service';
import { LeadsResolver } from './leads.resolver';
import { LeadAssignmentService } from './lead-assignment.service';
import { Lead, LeadSchema } from './schemas/lead.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { ProductsModule } from '../products/products.module';
import { EmailModule } from '../email/email.module';
import { CustomersModule } from '../customers/customers.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Lead.name, schema: LeadSchema },
      { name: User.name, schema: UserSchema },
    ]),
    ProductsModule,
    EmailModule,
    CustomersModule,
    NotificationsModule,
  ],
  providers: [LeadsService, LeadsResolver, LeadAssignmentService],
  exports: [LeadsService, LeadAssignmentService],
})
export class LeadsModule {}
