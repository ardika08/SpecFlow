/**
 * Notification Types (shared between client and server)
 */

export type NotificationType =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "quota_warning"
  | "payment_success"
  | "prd_generated"
  | "chat_reply";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  read: boolean;
  createdAt: Date | string;
  metadata?: Record<string, unknown>;
}

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
} as const;
