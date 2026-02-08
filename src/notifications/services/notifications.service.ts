import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification } from '../schemas/notification.schema';
import { NotificationType } from '../enums/notification-type.enum';
import { PushService } from './push.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<Notification>,
    private pushService: PushService,
  ) {}

  /**
   * Crear una notificación y enviar push automáticamente
   */
  async create(
    userId: string,
    title: string,
    body: string,
    type: NotificationType,
    data?: Record<string, any>,
  ): Promise<Notification> {
    const notification = new this.notificationModel({
      userId,
      title,
      body,
      type,
      data: data || null,
      read: false,
      sent: false,
    });

    await notification.save();

    // Enviar notificación push en background (no bloqueante)
    this.pushService
      .sendToUser(userId, {
        title,
        body,
        type,
        data: { ...data, notificationId: notification.id },
      })
      .then(async () => {
        // Marcar como enviada
        notification.sent = true;
        await notification.save();
      })
      .catch((error) => {
        console.error('Error sending push notification:', error);
        // No fallar la creación de la notificación si falla el push
      });

    return notification;
  }

  /**
   * Obtener notificaciones del usuario (paginadas)
   */
  async findByUser(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<Notification[]> {
    const skip = (page - 1) * limit;

    return this.notificationModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }

  /**
   * Obtener una notificación por ID
   */
  async findOne(id: string, userId: string): Promise<Notification | null> {
    return this.notificationModel.findOne({ _id: id, userId }).exec();
  }

  /**
   * Obtener contador de notificaciones no leídas
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel
      .countDocuments({ userId, read: false })
      .exec();
  }

  /**
   * Marcar notificación como leída
   */
  async markAsRead(id: string, userId: string): Promise<Notification | null> {
    const notification = await this.notificationModel
      .findOneAndUpdate(
        { _id: id, userId },
        { read: true, readAt: new Date() },
        { new: true },
      )
      .exec();

    return notification;
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.notificationModel
      .updateMany({ userId, read: false }, { read: true, readAt: new Date() })
      .exec();

    return result.modifiedCount;
  }

  /**
   * Eliminar una notificación
   */
  async delete(id: string, userId: string): Promise<boolean> {
    const result = await this.notificationModel
      .deleteOne({ _id: id, userId })
      .exec();

    return result.deletedCount > 0;
  }

  /**
   * Eliminar notificaciones antiguas (más de 30 días)
   */
  async cleanupOldNotifications(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.notificationModel
      .deleteMany({
        createdAt: { $lt: thirtyDaysAgo },
        read: true,
      })
      .exec();

    return result.deletedCount;
  }
}
