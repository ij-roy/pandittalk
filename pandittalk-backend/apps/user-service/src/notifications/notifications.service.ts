import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Notification, NotificationType } from '@prisma/client';
import { ChatGateway } from '../chat/chat.gateway';
import { PrismaService } from '../prisma/prisma.service';
import { ExpoPushService } from './expo-push.service';

export type NotificationPayload = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  bookingId: string | null;
  isRead: boolean;
  createdAt: string;
};

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
    private readonly expoPush: ExpoPushService,
  ) {}

  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    bookingId?: string,
  ): Promise<Notification> {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        bookingId: bookingId ?? null,
      },
    });

    this.chatGateway.emitNewNotification(userId, this.toPayload(notification));
    void this.expoPush.sendToUser(userId, title, body, {
      notificationId: notification.id,
      type,
      bookingId: bookingId ?? null,
    });
    return notification;
  }

  async findAllForUser(userId: string): Promise<NotificationPayload[]> {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return notifications.map((n) => this.toPayload(n));
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { updated: result.count };
  }

  async markOneRead(
    userId: string,
    notificationId: string,
  ): Promise<NotificationPayload> {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return this.toPayload(updated);
  }

  private toPayload(notification: Notification): NotificationPayload {
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      bookingId: notification.bookingId,
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString(),
    };
  }
}
