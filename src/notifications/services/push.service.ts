import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as webpush from 'web-push';
import { PushSubscription } from '../schemas/push-subscription.schema';

@Injectable()
export class PushService implements OnModuleInit {
  private vapidPublicKey: string;
  private vapidPrivateKey: string;

  constructor(
    @InjectModel(PushSubscription.name)
    private pushSubscriptionModel: Model<PushSubscription>,
    private configService: ConfigService,
  ) {}

  onModuleInit() {
    this.setupVapidKeys();
  }

  /**
   * Configurar VAPID keys (se generan automáticamente si no existen)
   */
  private setupVapidKeys(): void {
    this.vapidPublicKey =
      this.configService.get<string>('VAPID_PUBLIC_KEY') || '';
    this.vapidPrivateKey =
      this.configService.get<string>('VAPID_PRIVATE_KEY') || '';

    // Si no existen, generar nuevas keys
    if (!this.vapidPublicKey || !this.vapidPrivateKey) {
      const vapidKeys = webpush.generateVAPIDKeys();
      this.vapidPublicKey = vapidKeys.publicKey;
      this.vapidPrivateKey = vapidKeys.privateKey;

      console.warn('⚠️  VAPID keys no encontradas. Se generaron nuevas keys:');
      console.warn('Agregar al archivo .env:');
      console.warn(`VAPID_PUBLIC_KEY=${this.vapidPublicKey}`);
      console.warn(`VAPID_PRIVATE_KEY=${this.vapidPrivateKey}`);
      console.warn(`VAPID_SUBJECT=mailto:admin@qr-showroom.com`);
    }

    // Configurar web-push con las VAPID keys
    const subject =
      this.configService.get<string>('VAPID_SUBJECT') ||
      'mailto:admin@qr-showroom.com';

    webpush.setVapidDetails(subject, this.vapidPublicKey, this.vapidPrivateKey);
  }

  /**
   * Obtener la clave pública VAPID (para el frontend)
   */
  getVapidPublicKey(): string {
    return this.vapidPublicKey;
  }

  /**
   * Guardar suscripción de dispositivo
   */
  async subscribe(
    userId: string,
    endpoint: string,
    p256dh: string,
    auth: string,
    userAgent?: string,
  ): Promise<PushSubscription> {
    // Verificar si ya existe una suscripción con este endpoint
    let subscription = await this.pushSubscriptionModel
      .findOne({ endpoint })
      .exec();

    if (subscription) {
      // Actualizar suscripción existente
      subscription.userId = userId;
      subscription.keys = { p256dh, auth };
      subscription.userAgent = userAgent || subscription.userAgent;
      subscription.isActive = true;
      subscription.lastUsedAt = new Date();
      await subscription.save();
    } else {
      // Crear nueva suscripción
      subscription = new this.pushSubscriptionModel({
        userId,
        endpoint,
        keys: { p256dh, auth },
        userAgent,
        isActive: true,
        lastUsedAt: new Date(),
      });
      await subscription.save();
    }

    return subscription;
  }

  /**
   * Eliminar suscripción por endpoint
   */
  async unsubscribe(userId: string, endpoint: string): Promise<boolean> {
    const result = await this.pushSubscriptionModel
      .deleteOne({ userId, endpoint })
      .exec();

    return result.deletedCount > 0;
  }

  /**
   * Obtener todas las suscripciones activas de un usuario
   */
  async getUserSubscriptions(userId: string): Promise<PushSubscription[]> {
    return this.pushSubscriptionModel.find({ userId, isActive: true }).exec();
  }

  /**
   * Enviar notificación push a un usuario (todas sus suscripciones)
   */
  async sendToUser(
    userId: string,
    payload: {
      title: string;
      body: string;
      type: string;
      data?: Record<string, any>;
    },
  ): Promise<void> {
    const subscriptions = await this.getUserSubscriptions(userId);

    if (subscriptions.length === 0) {
      console.log(`No active subscriptions for user ${userId}`);
      return;
    }

    const payloadString = JSON.stringify(payload);

    // Enviar a todas las suscripciones del usuario
    const sendPromises = subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.keys.p256dh,
              auth: subscription.keys.auth,
            },
          },
          payloadString,
        );

        // Actualizar lastUsedAt
        subscription.lastUsedAt = new Date();
        await subscription.save();
      } catch (error: unknown) {
        console.error(`Error sending push to ${subscription.endpoint}:`, error);

        // Si el endpoint ya no es válido (410 Gone), desactivar la suscripción
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 410 || statusCode === 404) {
          subscription.isActive = false;
          await subscription.save();
        }
      }
    });

    await Promise.all(sendPromises);
  }

  /**
   * Enviar notificación push a múltiples usuarios
   */
  async sendToUsers(
    userIds: string[],
    payload: {
      title: string;
      body: string;
      type: string;
      data?: Record<string, any>;
    },
  ): Promise<void> {
    const sendPromises = userIds.map((userId) =>
      this.sendToUser(userId, payload),
    );
    await Promise.all(sendPromises);
  }

  /**
   * Limpiar suscripciones inactivas o muy antiguas
   */
  async cleanupExpiredSubscriptions(): Promise<number> {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const result = await this.pushSubscriptionModel
      .deleteMany({
        $or: [{ isActive: false }, { lastUsedAt: { $lt: sixtyDaysAgo } }],
      })
      .exec();

    return result.deletedCount;
  }
}
