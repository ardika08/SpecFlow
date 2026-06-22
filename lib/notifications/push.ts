/**
 * In-App Notification System (Server-side)
 * Stores notifications in database and provides real-time updates
 */

import { db, notifications } from "@/lib/db";
import { nanoid } from "nanoid";
import { eq, desc } from "drizzle-orm";
import type { Notification, NotificationType } from "./types";

export type { Notification, NotificationType } from "./types";
export type CreateNotificationInput = Omit<Notification, "id" | "read" | "createdAt">;
export type CreateNotificationClientInput = Omit<CreateNotificationInput, "userId">;

/**
 * Create a new notification
 */
export async function createNotification(input: CreateNotificationInput): Promise<Notification> {
  const notificationId = nanoid();
  const now = new Date();

  const notification = await db
    .insert(notifications)
    .values({
      id: notificationId,
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      actionUrl: input.actionUrl || null,
      actionLabel: input.actionLabel || null,
      read: false,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      createdAt: now,
    })
    .returning()
    .get();

  return {
    id: notification.id,
    userId: notification.userId,
    type: notification.type as NotificationType,
    title: notification.title,
    message: notification.message,
    actionUrl: notification.actionUrl || undefined,
    actionLabel: notification.actionLabel || undefined,
    read: notification.read,
    createdAt: notification.createdAt,
    metadata: notification.metadata ? JSON.parse(notification.metadata) : undefined,
  };
}

/**
 * Get all notifications for a user
 */
export async function getUserNotifications(userId: string): Promise<Notification[]> {
  const userNotifications = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(50)
    .all();

  return userNotifications.map((n) => ({
    id: n.id,
    userId: n.userId,
    type: n.type as NotificationType,
    title: n.title,
    message: n.message,
    actionUrl: n.actionUrl || undefined,
    actionLabel: n.actionLabel || undefined,
    read: n.read,
    createdAt: n.createdAt,
    metadata: n.metadata ? JSON.parse(n.metadata) : undefined,
  }));
}

/**
 * Get unread notifications count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const result = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .all();

  return result.filter((n) => !n.read).length;
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
  await db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.id, notificationId))
    .run();
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<void> {
  const userNotifications = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .all();

  for (const notification of userNotifications) {
    if (!notification.read) {
      await db
        .update(notifications)
        .set({ read: true })
        .where(eq(notifications.id, notification.id))
        .run();
    }
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  await db.delete(notifications).where(eq(notifications.id, notificationId)).run();
}

/**
 * Client-side helper to create a notification via API
 */
export async function createNotificationFromClient(input: CreateNotificationClientInput): Promise<Notification | null> {
  try {
    const response = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      console.error("Failed to create notification:", await response.text());
      return null;
    }

    const data = await response.json();
    return data.notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}

/**
 * Helper to trigger common notifications from the client
 */
export const notify = {
  prdGenerated: async (projectTitle: string, projectId: string) => {
    await createNotificationFromClient({
      type: "prd_generated",
      title: "PRD Selesai Dibuat",
      message: `"${projectTitle}" telah selesai dibuat. Siap untuk direview!`,
      actionUrl: `/?screen=result&project=${projectId}`,
      actionLabel: "Lihat Hasil",
      metadata: { projectId, projectTitle },
    });
  },

  quotaWarning: async (quotaUsed: number, quotaLimit: number, tier: string) => {
    await createNotificationFromClient({
      type: "quota_warning",
      title: "Kuota Hampir Habis",
      message: `Anda telah menggunakan ${quotaUsed} dari ${quotaLimit} kuota ${tier}. Sisa ${quotaLimit - quotaUsed} lagi.`,
      actionUrl: "/pricing",
      actionLabel: "Upgrade",
      metadata: { quotaUsed, quotaLimit, tier },
    });
  },

  chatReply: async (projectName: string) => {
    await createNotificationFromClient({
      type: "chat_reply",
      title: "AI Agent Membalas",
      message: `AI Agent telah memberikan respons untuk "${projectName}".`,
      actionUrl: "/dashboard",
      actionLabel: "Lihat",
      metadata: { projectName },
    });
  },

  tierUpgraded: async (fromTier: string, toTier: string) => {
    await createNotificationFromClient({
      type: "success",
      title: "Paket Diupgrade!",
      message: `Paket Anda telah diupgrade dari ${fromTier} ke ${toTier}. Nikmati fitur baru!`,
      actionUrl: "/subscription",
      actionLabel: "Lihat Paket",
      metadata: { fromTier, toTier },
    });
  },
};

/**
 * Create notifications for common events
 */
export const notificationCreators = {
  paymentSuccess: (userId: string, tier: string, amount: number) =>
    createNotification({
      userId,
      type: "payment_success",
      title: "Pembayaran Berhasil",
      message: `Pembayaran untuk paket ${tier} sebesar Rp${amount.toLocaleString("id-ID")} telah berhasil.`,
      actionUrl: "/subscription",
      actionLabel: "Lihat Paket",
      metadata: { tier, amount },
    }),

  quotaWarning: (userId: string, quotaUsed: number, quotaLimit: number, tier: string) =>
    createNotification({
      userId,
      type: "quota_warning",
      title: "Kuota Hampir Habis",
      message: `Anda telah menggunakan ${quotaUsed} dari ${quotaLimit} kuota ${tier}. Sisa ${quotaLimit - quotaUsed} lagi.`,
      actionUrl: "/pricing",
      actionLabel: "Upgrade",
      metadata: { quotaUsed, quotaLimit, tier },
    }),

  prdGenerated: (userId: string, projectTitle: string, projectId: string) =>
    createNotification({
      userId,
      type: "prd_generated",
      title: "PRD Selesai Dibuat",
      message: `"${projectTitle}" telah selesai dibuat. Siap untuk direview!`,
      actionUrl: `/?screen=result&project=${projectId}`,
      actionLabel: "Lihat Hasil",
      metadata: { projectId, projectTitle },
    }),

  chatReply: (userId: string, projectName: string) =>
    createNotification({
      userId,
      type: "chat_reply",
      title: "AI Agent Membalas",
      message: `AI Agent telah memberikan respons untuk "${projectName}".`,
      actionUrl: "/dashboard",
      actionLabel: "Lihat",
      metadata: { projectName },
    }),

  accountCreated: (userId: string, userName: string) =>
    createNotification({
      userId,
      type: "success",
      title: "Selamat Datang!",
      message: `Halo ${userName}, selamat datang di SpecFlow! Mulai dengan membuat PRD pertamamu.`,
      actionUrl: "/",
      actionLabel: "Mulai",
    }),

  passwordChanged: (userId: string) =>
    createNotification({
      userId,
      type: "success",
      title: "Password Diubah",
      message: "Password akun Anda telah berhasil diubah.",
      actionUrl: "/settings",
      actionLabel: "Ke Pengaturan",
    }),

  tierUpgraded: (userId: string, fromTier: string, toTier: string) =>
    createNotification({
      userId,
      type: "success",
      title: "Paket Diupgrade!",
      message: `Paket Anda telah diupgrade dari ${fromTier} ke ${toTier}. Nikmati fitur baru!`,
      actionUrl: "/subscription",
      actionLabel: "Lihat Paket",
      metadata: { fromTier, toTier },
    }),
};

/**
 * Notification type to icon/styling mapping
 */
export const notificationStyles = {
  info: {
    icon: "ℹ️",
    color: "text-blue-400",
    bgColor: "bg-blue-500/14 border-blue-500/25",
  },
  success: {
    icon: "✓",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/14 border-emerald-500/25",
  },
  warning: {
    icon: "⚠",
    color: "text-amber-400",
    bgColor: "bg-amber-500/14 border-amber-500/25",
  },
  error: {
    icon: "✕",
    color: "text-red-400",
    bgColor: "bg-red-500/14 border-red-500/25",
  },
  quota_warning: {
    icon: "📊",
    color: "text-amber-400",
    bgColor: "bg-amber-500/14 border-amber-500/25",
  },
  payment_success: {
    icon: "💳",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/14 border-emerald-500/25",
  },
  prd_generated: {
    icon: "📄",
    color: "text-blue-400",
    bgColor: "bg-blue-500/14 border-blue-500/25",
  },
  chat_reply: {
    icon: "💬",
    color: "text-purple-400",
    bgColor: "bg-purple-500/14 border-purple-500/25",
  },
};
