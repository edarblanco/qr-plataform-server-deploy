import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { NotificationsService } from './services/notifications.service';
import { PushService } from './services/push.service';
import { NotificationsResolver } from './notifications.resolver';
import {
  Notification,
  NotificationSchema,
} from './schemas/notification.schema';
import {
  PushSubscription,
  PushSubscriptionSchema,
} from './schemas/push-subscription.schema';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: PushSubscription.name, schema: PushSubscriptionSchema },
    ]),
  ],
  providers: [NotificationsService, PushService, NotificationsResolver],
  exports: [NotificationsService, PushService],
})
export class NotificationsModule {}
