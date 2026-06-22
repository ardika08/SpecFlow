import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "@/lib/notifications/push";


// GET /api/notifications - Get user's notifications
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const unreadOnly = searchParams.get("unread") === "true";

    if (unreadOnly) {
      const count = await getUnreadCount(session.user.id);
      return NextResponse.json({ count });
    }

    const notifications = await getUserNotifications(session.user.id);
    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

// POST /api/notifications - Create a new notification
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, title, message, actionUrl, actionLabel, metadata } = body;

    if (!type || !title || !message) {
      return NextResponse.json(
        { error: "Missing required fields: type, title, message" },
        { status: 400 }
      );
    }

    const notification = await createNotification({
      userId: session.user.id, // Use session userId instead of from body
      type,
      title,
      message,
      actionUrl,
      actionLabel,
      metadata,
    });

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
  }
}

// PATCH /api/notifications - Update notification (mark as read, etc.)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId, markAll } = body;

    if (markAll) {
      await markAllAsRead(session.user.id);
      return NextResponse.json({ message: "All notifications marked as read" });
    }

    if (notificationId) {
      await markAsRead(notificationId);
      return NextResponse.json({ message: "Notification marked as read" });
    }

    return NextResponse.json({ error: "notificationId or markAll required" }, { status: 400 });
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}

// DELETE /api/notifications?id=xxx - Delete a notification
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const notificationId = searchParams.get("id");

    if (!notificationId) {
      return NextResponse.json({ error: "Notification ID required" }, { status: 400 });
    }

    await deleteNotification(notificationId);
    return NextResponse.json({ message: "Notification deleted" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 });
  }
}
