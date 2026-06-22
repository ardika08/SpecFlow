/**
 * Email Notification Service
 * Supports multiple email providers (Resend, SendGrid, Brevo, etc.)
 */

export type EmailProvider = "resend" | "sendgrid" | "brevo" | "smtp";

export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * Email Service Class
 */
export class EmailService {
  private provider: EmailProvider;
  private apiKey: string;
  private fromEmail: string;

  constructor(provider: EmailProvider = "resend") {
    this.provider = provider;
    this.apiKey = process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY || "";
    this.fromEmail = process.env.EMAIL_FROM || "noreply@specflow.app";
  }

  /**
   * Send email using the configured provider
   */
  async send(options: EmailOptions): Promise<boolean> {
    try {
      if (!this.apiKey) {
        console.warn("Email API key not configured, skipping email send");
        return false;
      }

      switch (this.provider) {
        case "resend":
          return await this.sendViaResend(options);
        case "sendgrid":
          return await this.sendViaSendGrid(options);
        case "brevo":
          return await this.sendViaBrevo(options);
        default:
          console.warn("Unknown email provider:", this.provider);
          return false;
      }
    } catch (error) {
      console.error("Email send error:", error);
      return false;
    }
  }

  /**
   * Send email via Resend (recommended for Next.js apps)
   */
  private async sendViaResend(options: EmailOptions): Promise<boolean> {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: options.from || this.fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        reply_to: options.replyTo,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Resend API error:", error);
      return false;
    }

    return true;
  }

  /**
   * Send email via SendGrid
   */
  private async sendViaSendGrid(options: EmailOptions): Promise<boolean> {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: options.to }],
            subject: options.subject,
          },
        ],
        from: { email: options.from || this.fromEmail },
        content: [
          { type: "text/plain", value: options.text || "" },
          { type: "text/html", value: options.html || "" },
        ],
      }),
    });

    return response.ok;
  }

  /**
   * Send email via Brevo (formerly SendinBlue)
   */
  private async sendViaBrevo(options: EmailOptions): Promise<boolean> {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": this.apiKey,
        "Content-Type": "application/json",
        "accept": "application/json",
      },
      body: JSON.stringify({
        sender: { email: options.from || this.fromEmail, name: "SpecFlow" },
        to: [{ email: options.to }],
        subject: options.subject,
        htmlContent: options.html,
        textContent: options.text,
      }),
    });

    return response.ok;
  }
}

/**
 * Email Templates
 */
export const emailTemplates = {
  paymentSuccess: (userName: string, tier: string, amount: number): EmailTemplate => ({
    subject: "Pembayaran Berhasil - SpecFlow",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">SpecFlow</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Halo ${userName},</p>
          <p>Pembayaran Anda telah berhasil dikonfirmasi!</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Paket:</strong> ${tier}</p>
            <p><strong>Jumlah:</strong> Rp${amount.toLocaleString("id-ID")}</p>
          </div>
          <p>Paket ${tier} Anda sekarang aktif. Anda bisa langsung mulai menggunakan semua fitur yang tersedia.</p>
          <p style="margin-top: 30px;">
            <a href="${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/subscription" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">Ke Dashboard</a>
          </p>
        </div>
      </div>
    `,
    text: `
      Halo ${userName},

      Pembayaran Anda telah berhasil dikonfirmasi!

      Paket: ${tier}
      Jumlah: Rp${amount.toLocaleString("id-ID")}

      Paket ${tier} Anda sekarang aktif. Anda bisa langsung mulai menggunakan semua fitur yang tersedia.

      Kunjungi dashboard: ${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/subscription
    `,
  }),

  quotaWarning: (userName: string, quotaUsed: number, quotaLimit: number, tier: string): EmailTemplate => ({
    subject: "Kuota Anda Hampir Habis - SpecFlow",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">SpecFlow</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Halo ${userName},</p>
          <p>Kuota ${tier} Anda hampir habis!</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Penggunaan:</strong> ${quotaUsed} / ${quotaLimit}</p>
            <p><strong>Sisa:</strong> ${quotaLimit - quotaUsed}</p>
          </div>
          <p>Anda masih bisa membuat ${quotaLimit - quotaUsed} PRD lagi sebelum kuota reset.</p>
          <p style="margin-top: 30px;">
            <a href="${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/pricing" style="background: #f5576c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">Upgrade Paket</a>
          </p>
        </div>
      </div>
    `,
    text: `
      Halo ${userName},

      Kuota ${tier} Anda hampir habis!

      Penggunaan: ${quotaUsed} / ${quotaLimit}
      Sisa: ${quotaLimit - quotaUsed}

      Anda masih bisa membuat ${quotaLimit - quotaUsed} PRD lagi sebelum kuota reset.

      Upgrade paket: ${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/pricing
    `,
  }),

  welcome: (userName: string): EmailTemplate => ({
    subject: "Selamat Datang di SpecFlow!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">Selamat Datang di SpecFlow!</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Halo ${userName},</p>
          <p>Terima kasih telah bergabung dengan SpecFlow!</p>
          <p>SpecFlow adalah platform yang membantu Anda membuat Product Requirement Document (PRD) yang komprehensif dalam waktu kurang dari 10 menit.</p>
          <h3>Apa yang bisa Anda lakukan?</h3>
          <ul>
            <li>Buat PRD dari ide kasar dengan bantuan AI</li>
            <li>Revisi dan refine dokumen dengan AI Agent interaktif</li>
            <li>Generate diagram arsitektur otomatis</li>
            <li>Export dokumen ke berbagai format</li>
          </ul>
          <p style="margin-top: 30px;">
            <a href="${process.env.BETTER_AUTH_URL || "http://localhost:3000"}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">Mulai Sekarang</a>
          </p>
        </div>
      </div>
    `,
    text: `
      Halo ${userName},

      Terima kasih telah bergabung dengan SpecFlow!

      SpecFlow adalah platform yang membantu Anda membuat Product Requirement Document (PRD) yang komprehensif dalam waktu kurang dari 10 menit.

      Apa yang bisa Anda lakukan?
      - Buat PRD dari ide kasar dengan bantuan AI
      - Revisi dan refine dokumen dengan AI Agent interaktif
      - Generate diagram arsitektur otomatis
      - Export dokumen ke berbagai format

      Mulai sekarang: ${process.env.BETTER_AUTH_URL || "http://localhost:3000"}
    `,
  }),

  passwordChanged: (userName: string): EmailTemplate => ({
    subject: "Password Berhasil Diubah - SpecFlow",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">SpecFlow</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Halo ${userName},</p>
          <p>Password akun Anda telah berhasil diubah.</p>
          <p>Jika Anda tidak merasa melakukan perubahan ini, segera hubungi support.</p>
          <p style="margin-top: 30px;">
            <a href="${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/settings" style="background: #11998e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">Ke Pengaturan</a>
          </p>
        </div>
      </div>
    `,
    text: `
      Halo ${userName},

      Password akun Anda telah berhasil diubah.

      Jika Anda tidak merasa melakukan perubahan ini, segera hubungi support.

      Ke pengaturan: ${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/settings
    `,
  }),
};

/**
 * Create email service instance
 */
export function createEmailService(): EmailService {
  const provider = (process.env.EMAIL_PROVIDER || "resend") as EmailProvider;
  return new EmailService(provider);
}

/**
 * Quick email send function
 */
export async function sendEmail(
  to: string,
  template: EmailTemplate,
  provider?: EmailProvider
): Promise<boolean> {
  const service = provider ? new EmailService(provider) : createEmailService();

  return await service.send({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}
