/**
 * PostHog Analytics Configuration
 * Docs: https://posthog.com/docs
 */

export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
export const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";

export const isPostHogEnabled = Boolean(POSTHOG_KEY);

/**
 * PostHog page view tracking (server-side safe)
 */
export function trackPageView(pathname: string, properties?: Record<string, unknown>) {
  if (typeof window !== "undefined" && isPostHogEnabled) {
    const posthogWindow = window as typeof window & { posthog?: { capture: (event: string, props?: Record<string, unknown>) => void } };
    if (posthogWindow.posthog) {
      posthogWindow.posthog.capture("$pageview", {
        $current_url: pathname,
        ...properties,
      });
    }
  }
}

/**
 * PostHog custom event tracking (server-side safe)
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>
) {
  if (typeof window !== "undefined" && isPostHogEnabled) {
    const posthogWindow = window as typeof window & { posthog?: { capture: (event: string, props?: Record<string, unknown>) => void } };
    if (posthogWindow.posthog) {
      posthogWindow.posthog.capture(eventName, properties);
    }
  }
}

/**
 * Common events for SpecFlow
 */
export const Events = {
  // Auth
  SIGN_UP: "sign_up",
  LOGIN: "login",
  LOGOUT: "logout",

  // PRD Generation
  PRD_STARTED: "prd_started",
  PRD_COMPLETED: "prd_completed",
  PRD_EXPORTED: "prd_exported",

  // Chat
  CHAT_MESSAGE_SENT: "chat_message_sent",
  CHAT_REVISION_COMPLETED: "chat_revision_completed",

  // Subscription
  PRICING_VIEWED: "pricing_viewed",
  PAYMENT_INITIATED: "payment_initiated",
  PAYMENT_COMPLETED: "payment_completed",
  TIER_UPGRADED: "tier_upgraded",

  // Project
  PROJECT_CREATED: "project_created",
  PROJECT_OPENED: "project_opened",
  PROJECT_DELETED: "project_deleted",
} as const;
