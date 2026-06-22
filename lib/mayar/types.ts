/**
 * Mayar Payment Gateway Types
 */

export type MayarEnvironment = "production" | "sandbox";

export interface MayarConfig {
  apiKey: string;
  webhookToken: string;
  mode: MayarEnvironment;
}

export interface MayarPaymentRequest {
  name: string;
  amount: number;
  description: string;
  redirectUrl?: string; // Redirect URL after payment
  customerName?: string; // Pre-fill customer name di halaman Mayar
  customerEmail?: string; // Pre-fill customer email di halaman Mayar
  customerPhone?: string; // Pre-fill customer WA/phone di halaman Mayar
  limit?: number; // Max uses (1 for single payment)
  type?: string; // "payment_request"
  expiredDate?: string; // ISO 8601 format
  metadata?: Record<string, unknown>;
}

export interface MayarPaymentResponse {
  success: boolean;
  message?: string;
  data?: {
    id: string;
    paymentLinkId?: string;
    link: string; // Payment URL (e.g., https://grafista.myr.id/pl/xxx/)
    transaction_id?: string | null;
    transactionId?: string | null;
  };
}

export interface MayarPaymentStatus {
  id: string;
  external_id: string;
  amount: number;
  status: "PENDING" | "PAID" | "EXPIRED" | "FAILED";
  description: string;
  payment_method?: string;
  paid_at?: string;
  expired_date: string;
  created_at: string;
  customer?: {
    email?: string;
    name?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface MayarWebhookPayload {
  id: string;
  external_id: string;
  amount: number;
  status: "PAID" | "EXPIRED" | "FAILED";
  description: string;
  payment_method?: string;
  paid_at?: string;
  customer?: {
    email?: string;
    name?: string;
  };
  metadata?: Record<string, unknown>;
  signature: string; // HMAC signature for verification
}

export type SubscriptionTier = "Freemium" | "Starter" | "Pro";

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  price: number;
  currency: string;
  interval: "monthly" | "yearly";
  features: string[];
  description: string;
}

export interface UserSubscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: "active" | "inactive" | "cancelled";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}
