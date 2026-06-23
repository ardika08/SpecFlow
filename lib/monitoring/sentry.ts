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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Sentry = await import("@sentry/nextjs") as any;

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

      beforeSend(event: unknown) {
        // Filter out sensitive data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((event as any).request) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          delete (event as any).request.cookies;
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
  if (isSentryEnabled && typeof window !== "undefined") {
    const sentryWindow = window as typeof window & { Sentry?: { captureException: (error: Error, context?: Record<string, unknown>) => void } };
    if (sentryWindow.Sentry) {
      sentryWindow.Sentry.captureException(error, { extra: context });
    }
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
  if (isSentryEnabled && typeof window !== "undefined") {
    const sentryWindow = window as typeof window & { Sentry?: { captureMessage: (message: string, context?: Record<string, unknown>) => void } };
    if (sentryWindow.Sentry) {
      sentryWindow.Sentry.captureMessage(message, { level, extra: context });
    }
  } else {
    console.log(`[${level.toUpperCase()}]`, message, context);
  }
}
