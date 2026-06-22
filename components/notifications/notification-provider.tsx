"use client";

import * as React from "react";
import { NotificationBell, NotificationPanel } from "./notification-bell";
import type { Notification } from "@/lib/notifications/types";

interface NotificationResponse {
  notifications: Notification[];
}

interface UnreadCountResponse {
  count: number;
}

export function NotificationProvider() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);

  // Fetch notifications
  const fetchNotifications = React.useCallback(async () => {
    try {
      const response = await fetch("/api/notifications");
      if (response.ok) {
        const data: NotificationResponse = await response.json();
        setNotifications(data.notifications);
        setUnreadCount(data.notifications.filter((n) => !n.read).length);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch unread count only (for polling)
  const fetchUnreadCount = React.useCallback(async () => {
    try {
      const response = await fetch("/api/notifications?unread=true");
      if (response.ok) {
        const data: UnreadCountResponse = await response.json();
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  }, []);

  // Mark notification as read
  const markAsRead = React.useCallback(
    async (id: string) => {
      try {
        const response = await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationId: id }),
        });

        if (response.ok) {
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } catch (error) {
        console.error("Failed to mark as read:", error);
      }
    },
    []
  );

  // Mark all as read
  const markAllAsRead = React.useCallback(async () => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  }, []);

  // Delete notification
  const deleteNotification = React.useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/notifications?id=${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          const deleted = notifications.find((n) => n.id === id);
          setNotifications((prev) => prev.filter((n) => n.id !== id));
          if (deleted && !deleted.read) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        }
      } catch (error) {
        console.error("Failed to delete notification:", error);
      }
    },
    [notifications]
  );

  // Initial fetch
  React.useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Poll for new notifications every 30 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Fetch when panel opens
  React.useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  return (
    <div className="relative">
      <NotificationBell
        unreadCount={unreadCount}
        onClick={() => setIsOpen(!isOpen)}
      />
      <NotificationPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        onRead={markAsRead}
        onReadAll={markAllAsRead}
        onDelete={deleteNotification}
      >
        {!isLoading && notifications.length > 0 && (
          <button
            onClick={() => {
              window.location.href = "/notifications";
            }}
            className="w-full text-xs text-center text-white/50 hover:text-white transition-colors py-1"
          >
            View all notifications
          </button>
        )}
      </NotificationPanel>
    </div>
  );
}
