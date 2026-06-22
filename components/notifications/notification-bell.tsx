"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { notificationStyles, type Notification, type NotificationType } from "@/lib/notifications/types";

interface NotificationBellProps {
  unreadCount: number;
  onClick: () => void;
  className?: string;
}

export function NotificationBell({ unreadCount, onClick, className }: NotificationBellProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center justify-center w-10 h-10 rounded-full transition-colors",
        "hover:bg-white/10",
        className
      )}
      aria-label="Notifications"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-5 h-5 text-white/70 hover:text-white"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
        />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onRead?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function NotificationItem({ notification, onRead, onDelete }: NotificationItemProps) {
  const style = notificationStyles[notification.type] || notificationStyles.info;
  const timeAgo = getTimeAgo(new Date(notification.createdAt));

  const handleClick = () => {
    if (!notification.read && onRead) {
      onRead(notification.id);
    }
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(notification.id);
    }
  };

  return (
    <div
      className={cn(
        "group relative flex items-start gap-3 p-4 border border-white/10 rounded-lg cursor-pointer transition-colors hover:bg-white/5",
        !notification.read && "bg-white/5"
      )}
      onClick={handleClick}
    >
      <div
        className={cn(
          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg",
          style.bgColor
        )}
      >
        <span className={style.color}>{style.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className={cn("text-sm font-medium text-white", !notification.read && "font-semibold")}>
            {notification.title}
          </h4>
          {!notification.read && (
            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-400" />
          )}
        </div>
        <p className="text-sm text-white/60 mt-0.5 line-clamp-2">{notification.message}</p>
        <p className="text-xs text-white/40 mt-1.5">{timeAgo}</p>
        {notification.actionLabel && (
          <span className="inline-flex items-center text-xs text-blue-400 mt-2 group-hover:text-blue-300">
            {notification.actionLabel} →
          </span>
        )}
      </div>
      <button
        onClick={handleDelete}
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded"
        aria-label="Delete notification"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-4 h-4 text-white/40 hover:text-white/70"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  unreadCount: number;
  onRead?: (id: string) => void;
  onReadAll?: () => void;
  onDelete?: (id: string) => void;
  children?: React.ReactNode;
}

export function NotificationPanel({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  onRead,
  onReadAll,
  onDelete,
  children,
}: NotificationPanelProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);

  // Close panel when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onClose]);

  return (
    <div
      ref={panelRef}
      className={cn(
        "absolute top-full right-0 mt-2 w-96 max-h-[500px] overflow-hidden rounded-xl bg-[#142030]/95 backdrop-blur border border-white/10 shadow-2xl transition-all duration-200",
        !isOpen && "opacity-0 pointer-events-none scale-95",
        isOpen && "opacity-100 scale-100"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-full">
              {unreadCount} unread
            </span>
          )}
        </div>
        {unreadCount > 0 && onReadAll && (
          <button
            onClick={onReadAll}
            className="text-xs text-white/50 hover:text-white transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="overflow-y-auto max-h-[420px]">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <span className="text-4xl mb-3">🔔</span>
            <p className="text-sm text-white/60">No notifications yet</p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={onRead}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>

      {children && (
        <div className="p-3 border-t border-white/10">
          {children}
        </div>
      )}
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return new Date(date).toLocaleDateString();
}
