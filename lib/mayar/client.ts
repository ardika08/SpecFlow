/**
 * Mayar Payment Gateway Client
 * Documentation: https://docs.mayar.id/
 */

import crypto from "crypto";
import type {
  MayarConfig,
  MayarEnvironment,
  MayarPaymentRequest,
  MayarPaymentResponse,
  MayarPaymentStatus,
  MayarWebhookPayload,
} from "./types";

// Mayar API Base URLs
// Docs: https://docs.mayar.id/api-reference/introduction
const MAYAR_BASE_URLS: Record<MayarEnvironment, string> = {
  production: "https://api.mayar.id/hl/v1",
  sandbox: "https://api.mayar.club/hl/v1",
};

/**
 * Mayar API Client Class
 */
export class MayarClient {
  private config: MayarConfig;
  private baseUrl: string;

  constructor(config: MayarConfig) {
    this.config = config;
    this.baseUrl = MAYAR_BASE_URLS[config.mode];
  }

  /**
   * Get authorization headers for API requests
   */
  private getHeaders(): HeadersInit {
    return {
      "Authorization": `Bearer ${this.config.apiKey}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    };
  }

  /**
   * Create a new payment link
   * Endpoint: POST /payment/create
   */
  async createPayment(request: MayarPaymentRequest): Promise<MayarPaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/payment/create`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(15000), // 15s timeout
      });

      // Handle non-JSON responses (e.g. "Bad Gateway" HTML from server)
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Mayar API non-JSON response:", response.status, text.substring(0, 200));
        return {
          success: false,
          message: `Mayar API error (${response.status}). ${response.status === 502 ? "Server Mayar sedang tidak tersedia." : "Silakan coba lagi."}`,
        };
      }

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || data.messages || `Payment API error (${response.status})`,
        };
      }

      return {
        success: true,
        data: {
          id: data.data?.id || data.id,
          paymentLinkId: data.data?.paymentLinkId,
          link: data.data?.link || data.link,
          transaction_id: data.data?.transaction_id ?? null,
          transactionId: data.data?.transactionId ?? null,
        },
      };
    } catch (error) {
      console.error("Mayar API Error:", error);

      // Handle timeout & network errors with clear messages
      if (error instanceof TypeError && error.message.includes("fetch")) {
        return {
          success: false,
          message: `Tidak dapat terhubung ke Mayar API (${this.config.mode}). Periksa koneksi internet atau status Mayar.`,
        };
      }
      if (error instanceof DOMException && error.name === "TimeoutError") {
        return {
          success: false,
          message: "Mayar API timeout. Silakan coba lagi.",
        };
      }

      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Get payment status by payment link ID
   */
  async getPaymentStatus(paymentLinkId: string): Promise<MayarPaymentStatus | null> {
    try {
      const response = await fetch(`${this.baseUrl}/payment/${paymentLinkId}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        console.error("Failed to get payment status:", response.statusText);
        return null;
      }

      const data = await response.json();
      const paymentData = data.data || data;

      return {
        id: paymentData.id,
        external_id: paymentData.link || paymentLinkId,
        amount: paymentData.amount,
        status: paymentData.status,
        description: paymentData.description,
        payment_method: paymentData.payment_method,
        paid_at: paymentData.paid_at,
        expired_date: paymentData.expired_date,
        created_at: paymentData.created_at,
        customer: data.customer,
        metadata: data.metadata,
      };
    } catch (error) {
      console.error("Mayar API Error:", error);
      return null;
    }
  }

  /**
   * Verify webhook signature
   * Mayar uses HMAC-SHA256 for webhook signature verification
   */
  verifyWebhookSignature(payload: MayarWebhookPayload): boolean {
    try {
      // Create signature string from payload (excluding signature field)
      const { signature, ...payloadData } = payload;

      // Sort keys alphabetically for consistent string generation
      const sortedKeys = Object.keys(payloadData).sort();

      // Create signature string
      const signatureString = sortedKeys
        .map((key) => `${key}=${JSON.stringify(payloadData[key as keyof typeof payloadData])}`)
        .join("&");

      // Generate HMAC-SHA256
      const hmac = crypto
        .createHmac("sha256", this.config.webhookToken)
        .update(signatureString)
        .digest("hex");

      // Compare with provided signature
      return hmac === signature;
    } catch (error) {
      console.error("Webhook verification error:", error);
      return false;
    }
  }

  /**
   * Get webhook payload from request headers and body
   */
  parseWebhook(headers: Headers, body: unknown): MayarWebhookPayload | null {
    try {
      // Mayar sends signature in X-Mayar-Signature header
      const signature = headers.get("x-mayar-signature");
      if (!signature) {
        console.error("Missing Mayar signature header");
        return null;
      }

      return {
        ...(body as MayarWebhookPayload),
        signature,
      };
    } catch (error) {
      console.error("Webhook parsing error:", error);
      return null;
    }
  }
}

/**
 * Create Mayar client instance from environment variables
 */
export function createMayarClient(): MayarClient {
  const apiKey = process.env.MAYAR_API_KEY;
  const webhookToken = process.env.MAYAR_WEBHOOK_TOKEN;
  const mode = (process.env.MAYAR_MODE || "production") as MayarEnvironment;

  if (!apiKey) {
    throw new Error("MAYAR_API_KEY is not configured");
  }

  if (!webhookToken) {
    throw new Error("MAYAR_WEBHOOK_TOKEN is not configured");
  }

  return new MayarClient({
    apiKey,
    webhookToken,
    mode,
  });
}

/**
 * Subscription Plans Configuration
 */
export const SUBSCRIPTION_PLANS = [
  {
    id: "starter-monthly",
    name: "Starter",
    tier: "Starter" as const,
    price: 49000,
    currency: "IDR",
    interval: "monthly" as const,
    description: "Cocok buat yang udah pengen hasil lebih mateng",
    features: [
      "5 PRD per bulan",
      "100 chat revisi via AI Agent",
      "Akses model high-end (Claude 3.5 Sonnet & GPT-4o)",
      "Export Markdown, PDF, dan diagram Mermaid ke PNG/SVG",
      "Riwayat project permanen + compare di dashboard",
    ],
  },
  {
    id: "pro-monthly",
    name: "Pro",
    tier: "Pro" as const,
    price: 125000,
    currency: "IDR",
    interval: "monthly" as const,
    description: "Buat yang kerjanya sat-set terus",
    features: [
      "Unlimited PRD selama langganan aktif",
      "Unlimited chat revisi via AI Agent",
      "Semua fitur Starter ikut kebuka",
      "Prioritas proses low latency",
      "Dukungan teknis prioritas",
    ],
  },
];
