/**
 * Unified Notification Helper
 *
 * Mengirim notifikasi melalui dua jalur sekaligus:
 *   1. In-App Notification  → disimpan ke DB, tampil di bell icon (polling)
 *   2. Email Notification   → dikirim via Resend/SendGrid/Brevo
 *
 * Email bersifat best-effort: jika API key belum diset atau pengiriman
 * gagal, notifikasi in-app tetap tersimpan. Error email tidak memblokir
 * flow utama.
 */

import { createNotification } from "./push";
import { sendEmail, emailTemplates } from "./email";
import type { NotificationType } from "./types";

export type { NotificationType } from "./types";

interface NotifyOptions {
  userId: string;
  userEmail: string;
  userName: string;

  /** In-app notification */
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;

  /** Email template yang akan dikirim (opsional) */
  emailTemplate?: ReturnType<
    | (typeof emailTemplates)["welcome"]
    | (typeof emailTemplates)["paymentSuccess"]
    | (typeof emailTemplates)["quotaWarning"]
    | (typeof emailTemplates)["passwordChanged"]
  >;
}

/**
 * Kirim notifikasi terpadu (in-app + email).
 *
 * @example
 * ```ts
 * await notifyUser({
 *   userId: user.id,
 *   userEmail: user.email,
 *   userName: user.name,
 *   type: "payment_success",
 *   title: "Pembayaran Berhasil",
 *   message: "Langganan Pro Anda telah diaktifkan.",
 *   actionUrl: "/dashboard",
 *   actionLabel: "Lihat Dashboard",
 *   emailTemplate: EmailTemplates.paymentSuccess(user.name, "Pro"),
 * });
 * ```
 */
export async function notifyUser(options: NotifyOptions): Promise<void> {
  const {
    userId,
    userEmail,
    userName: _userName,
    type,
    title,
    message,
    actionUrl,
    actionLabel,
    emailTemplate,
  } = options;

  // 1. Simpan in-app notification (selalu dijalankan)
  try {
    await createNotification({
      userId,
      type,
      title,
      message,
      actionUrl,
      actionLabel,
    });
  } catch (error) {
    console.error("Failed to create in-app notification:", error);
  }

  // 2. Kirim email (best-effort, tidak memblokir flow)
  if (emailTemplate) {
    try {
      await sendEmail(userEmail, emailTemplate);
    } catch (error) {
      console.error("Failed to send email notification:", error);
    }
  }
}

/* ------------------------------------------------------------------ */
/* Convenience functions untuk setiap event                            */
/* ------------------------------------------------------------------ */

/**
 * Kirim notifikasi welcome setelah user register.
 */
export async function notifyWelcome(
  userId: string,
  userEmail: string,
  userName: string
): Promise<void> {
  await notifyUser({
    userId,
    userEmail,
    userName,
    type: "success",
    title: "Selamat Datang di SpecFlow!",
    message: `Halo ${userName}, akun Anda sudah aktif. Mulai buat PRD pertama Anda sekarang!`,
    actionUrl: "/",
    actionLabel: "Mulai Buat PRD",
    emailTemplate: emailTemplates.welcome(userName),
  });
}

/**
 * Kirim notifikasi setelah pembayaran berhasil (upgrade tier).
 */
export async function notifyPaymentSuccess(
  userId: string,
  userEmail: string,
  userName: string,
  tier: string,
  amount?: number
): Promise<void> {
  await notifyUser({
    userId,
    userEmail,
    userName,
    type: "payment_success",
    title: "Pembayaran Berhasil!",
    message: `Langganan ${tier} Anda telah diaktifkan. Nikmati semua fitur premium SpecFlow!`,
    actionUrl: "/dashboard",
    actionLabel: "Lihat Dashboard",
    emailTemplate: emailTemplates.paymentSuccess(userName, tier, amount ?? 0),
  });
}

/**
 * Kirim notifikasi setelah password diubah.
 */
export async function notifyPasswordChanged(
  userId: string,
  userEmail: string,
  userName: string
): Promise<void> {
  await notifyUser({
    userId,
    userEmail,
    userName,
    type: "warning",
    title: "Password Berhasil Diubah",
    message: "Password akun Anda telah diubah. Jika ini bukan Anda, segera hubungi support.",
    actionUrl: "/settings",
    actionLabel: "Ke Pengaturan",
    emailTemplate: emailTemplates.passwordChanged(userName),
  });
}

/**
 * Kirim notifikasi peringatan kuota (saat penggunaan mendekati limit).
 */
export async function notifyQuotaWarning(
  userId: string,
  userEmail: string,
  userName: string,
  quotaUsed: number,
  quotaLimit: number,
  tier: string,
  resource: "PRD" | "chat"
): Promise<void> {
  await notifyUser({
    userId,
    userEmail,
    userName,
    type: "quota_warning",
    title: `Kuota ${resource} Hampir Habis`,
    message: `Anda sudah menggunakan ${quotaUsed} dari ${quotaLimit} ${resource} bulan ini. Upgrade paket untuk kuota lebih besar.`,
    actionUrl: "/pricing",
    actionLabel: "Upgrade Paket",
    emailTemplate: emailTemplates.quotaWarning(userName, quotaUsed, quotaLimit, `${tier} - ${resource}`),
  });
}

/**
 * Kirim notifikasi setelah PRD berhasil di-generate.
 */
export async function notifyPrdGenerated(
  userId: string,
  userEmail: string,
  userName: string,
  projectTitle: string
): Promise<void> {
  await notifyUser({
    userId,
    userEmail,
    userName,
    type: "prd_generated",
    title: "PRD Berhasil Dibuat!",
    message: `PRD untuk "${projectTitle}" telah selesai. Cek hasilnya sekarang!`,
    actionUrl: "/dashboard",
    actionLabel: "Lihat PRD",
    // Tidak ada email template khusus untuk PRD generated (in-app only)
  });
}
