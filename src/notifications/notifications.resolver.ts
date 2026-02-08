import {
  Resolver,
  Query,
  Mutation,
  Args,
  Int,
  ID,
  Context,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { NotificationsService } from './services/notifications.service';
import { PushService } from './services/push.service';
import { Notification } from './entities/notification.entity';
import { PushSubscriptionInput } from './dto/push-subscription.input';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';

@Resolver(() => Notification)
@UseGuards(GqlAuthGuard)
export class NotificationsResolver {
  constructor(
    private notificationsService: NotificationsService,
    private pushService: PushService,
  ) {}

  /**
   * Obtener notificaciones del usuario autenticado
   */
  @Query(() => [Notification], { name: 'notifications' })
  async getNotifications(
    @Context() context: any,
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 })
    page: number,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 })
    limit: number,
  ): Promise<Notification[]> {
    const userId = context.req.user._id.toString();
    return this.notificationsService.findByUser(userId, page, limit);
  }

  /**
   * Obtener contador de notificaciones no leídas
   */
  @Query(() => Int, { name: 'unreadCount' })
  async getUnreadCount(@Context() context: any): Promise<number> {
    const userId = context.req.user._id.toString();
    return this.notificationsService.getUnreadCount(userId);
  }

  /**
   * Obtener la clave pública VAPID para configurar Service Worker
   */
  @Query(() => String, { name: 'vapidPublicKey' })
  getVapidPublicKey(): string {
    return this.pushService.getVapidPublicKey();
  }

  /**
   * Suscribirse a notificaciones push
   */
  @Mutation(() => Boolean, { name: 'subscribeToPush' })
  async subscribeToPush(
    @Context() context: any,
    @Args('subscription') subscription: PushSubscriptionInput,
  ): Promise<boolean> {
    const userId = context.req.user._id.toString();
    await this.pushService.subscribe(
      userId,
      subscription.endpoint,
      subscription.p256dh,
      subscription.auth,
      undefined, // userAgent - opcional
    );
    return true;
  }

  /**
   * Desuscribirse de notificaciones push
   */
  @Mutation(() => Boolean, { name: 'unsubscribeFromPush' })
  async unsubscribeFromPush(
    @Context() context: any,
    @Args('endpoint') endpoint: string,
  ): Promise<boolean> {
    const userId = context.req.user._id.toString();
    return this.pushService.unsubscribe(userId, endpoint);
  }

  /**
   * Marcar notificación como leída
   */
  @Mutation(() => Notification, {
    name: 'markNotificationAsRead',
    nullable: true,
  })
  async markAsRead(
    @Context() context: any,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Notification | null> {
    const userId = context.req.user._id.toString();
    return this.notificationsService.markAsRead(id, userId);
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  @Mutation(() => Int, { name: 'markAllNotificationsAsRead' })
  async markAllAsRead(@Context() context: any): Promise<number> {
    const userId = context.req.user._id.toString();
    return this.notificationsService.markAllAsRead(userId);
  }

  /**
   * Eliminar notificación
   */
  @Mutation(() => Boolean, { name: 'deleteNotification' })
  async deleteNotification(
    @Context() context: any,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    const userId = context.req.user._id.toString();
    return this.notificationsService.delete(id, userId);
  }
}
