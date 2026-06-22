/**
 * Sentry Error Monitoring Configuration
 * Docs: https://docs.sentry.io/platforms/javascript/
 */

export const SENTRY_DSN = process.env.SENTRY_DSN;
export const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN;
export const SENTRY_ENVIRONMENT = process.env.NODE_ENV || "development";

export const isSentryEnabled = Boolean(SENTRY_DSN);

/**
 * Initialize Sentry client-side (called from app layout or page)
 */
export async function initSentry() {
  if (!isSentryEnabled || typeof window === "undefined") {
    return;
  }

  try {
    const Sentry = await import("@sentry/nextjs");

    Sentry.init({
      dsn: SENTRY_DSN,
      environment: SENTRY_ENVIRONMENT,
      tracesSampleRate: SENTRY_ENVIRONMENT === "production" ? 0.1 : 1.0,
      replaysSessionSampleRate: SENTRY_ENVIRONMENT === "production" ? 0.1 : 1.0,
      replaysOnErrorSampleRate: 1.0,

      integrations: [
        new Sentry.BrowserTracing(),
        new Sentry.Replay({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],

      beforeSend(event, hint) {
        // Filter out sensitive data
        if (event.request) {
          delete event.request.cookies;
        }
        return event;
      },

      // Filter out common development errors
      ignoreErrors: [
        // Random plugins/extensions
        "top.GLOBALS",
        "originalCreateNotification",
        "canvas.contentDocument",
        "MyApp_RemoveAllHighlights",
      ],

      denyUrls: [
        // Chrome extensions
        /extensions\//i,
        /^chrome:\/\//i,
        /^chrome-extension:\/\//i,
      ],
    });

    console.log("Sentry error monitoring enabled");
  } catch (error) {
    console.error("Failed to initialize Sentry:", error);
  }
}

/**
 * Capture exception with context
 */
export function captureException(error: Error, context?: Record<string, unknown>) {
  if (isSentryEnabled && typeof window !== "undefined" && (window as any).Sentry) {
    (window as any).Sentry.captureException(error, { extra: context });
  } else {
    console.error("Exception captured:", error, context);
  }
}

/**
 * Capture message with level
 */
export function captureMessage(
  message: string,
  level: "info" | "warning" | "error" = "info",
  context?: Record<string, unknown>
) {
  if (isSentryEnabled && typeof window !== "undefined" && (window as any).Sentry) {
    (window as any).Sentry.captureMessage(message, { level, extra: context });
  } else {
    console.log(`[${level.toUpperCase()}]`, message, context);
  }
}
