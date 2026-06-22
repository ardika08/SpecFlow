"use client";

import { useEffect } from "react";
import { POSTHOG_KEY, POSTHOG_HOST, isPostHogEnabled } from "@/lib/analytics/posthog";

/**
 * PostHog Provider Component
 * Initialize PostHog on client-side and capture page views
 */
export function PostHogProvider() {
  useEffect(() => {
    if (!isPostHogEnabled) return;

    // Load PostHog script
    const script = document.createElement("script");
    script.innerHTML = `
      !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]);t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlagPayload getActiveMatchingSurveys getSurvey getSurveys".split(" ");for(n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
      posthog.init('${POSTHOG_KEY}', {api_host: '${POSTHOG_HOST}'});
    `;
    script.async = true;

    document.head.appendChild(script);

    // Cleanup on unmount
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return null;
}

/**
 * PostHog Page View Tracker
 * Automatically tracks page views on route changes
 */
export function PostHogPageView({ path }: { path: string }) {
  useEffect(() => {
    if (!isPostHogEnabled || typeof window === "undefined") return;
    // Type-safe access to window.posthog
    const posthogWindow = window as typeof window & { posthog?: { capture: (event: string, props?: Record<string, unknown>) => void } };
    if (posthogWindow.posthog) {
      posthogWindow.posthog.capture("$pageview", {
        $current_url: path,
      });
    }
  }, [path]);

  return null;
}
