# SpecFlow - Project Progress Summary

**Last Updated:** 2026-06-22 (Update 2)

---

## 📊 Overall Progress: **~98% Complete**

| Category | Progress | Status |
|----------|----------|--------|
| Infrastruktur & Database | 100% | 🟢 |
| AI & Generation | 95% | 🟢 |
| Billing & Monetisasi | 100% | 🟢 |
| Export & Documentation | 100% | 🟢 |
| Notifications (In-App) | 95% | 🟢 |
| Notifications (Email) | 85% | 🟢 |
| Security & Auth | 100% | 🟢 |
| UI Components & Navbar | 100% | 🟢 |
| Analytics & Monitoring | 100% | 🟢 |

---

## 📋 Detailed Progress

### 1. INFRASTRUKTUR & DATABASE (100% 🟢)

| Feature | Status | File/Location | Notes |
|---------|--------|---------------|-------|
| Database Schema | ✅ | `lib/db/schema.ts` | 7 tabel: users (+ phone, currentPeriodEnd), sessions, accounts, projects, projectMessages, usageQuotas, notifications |
| Better Auth Integration | ✅ | `lib/auth/index.ts` | Login/Register/Session, 7-day expiry, `minPasswordLength: 6`, `trustedOrigins` untuk multi-port |
| Password Hashing (bcrypt) | ✅ | `lib/auth/password.ts` | hashPassword/verifyPassword utility |
| Drizzle ORM | ✅ | `lib/db/index.ts` | SQLite + WAL mode + auto-migrate + PostgreSQL support |
| Rate Limiting | ✅ | `lib/ai/rate-limit.ts` | Redis (ioredis) dengan fallback in-memory, atomic INCR + EXPIRE |
| PostgreSQL Migration | ✅ | `scripts/migrate-postgres.ts` | Migration script SQLite → PostgreSQL, DATABASE_PROVIDER switch |
| currentPeriodEnd Field | ✅ | `users.currentPeriodEnd` | 30-day subscription period, displayed in subscription page |
| Email Verification | ⚠️ | `lib/auth/index.ts` | Disabled by design (demo) |
| Dashboard Page | ✅ | `app/dashboard/page.tsx` | Project list + history |
| Middleware | ✅ | `middleware.ts` | Auth protection |

**Remaining:**
- Email verification setup (opsional, sengaja disabled untuk demo)

---

### 2. AI & GENERATION (95% 🟢)

| Feature | Status | File/Location | Notes |
|---------|--------|---------------|-------|
| Multi-AI Engine | ✅ | `lib/ai/client.ts` | Claude 3.5 Sonnet + GPT-4o dengan fallback |
| Streaming Generation (SSE) | ✅ | `app/api/generate/stream/route.ts` | Real-time PRD generation + quota check PRD |
| PRD Template | ✅ | `lib/ai/client.ts` | 13-section Markdown + Mermaid |
| Tech Stack AI | ✅ | `app/page.tsx` | Keyword-based + AI extraction |
| Chat AI Agent | ✅ | `app/api/chat/route.ts` | Streaming SSE dengan AI nyata + quota check chat |
| Tech Stack Extraction | ✅ | - | Auto-ekstraksi dari output AI |

**Remaining:**
- (Tidak ada blocker utama)

---

### 3. BILLING & MONETISASI (100% 🟢)

| Feature | Status | File/Location | Notes |
|---------|--------|---------------|-------|
| Mayar API Client | ✅ | `lib/mayar/client.ts` | Payment creation (`/payment/create`), status, webhook verification |
| Mayar Types | ✅ | `lib/mayar/types.ts` | TypeScript definitions + customer pre-fill fields |
| Payment API | ✅ | `app/api/payment/route.ts` | Create payment link + kirim customerName/Email/Phone ke Mayar |
| Webhook Handler | ✅ | `app/api/webhooks/mayar/route.ts` | HMAC signature verification, auto-upgrade tier, set currentPeriodEnd (+30 hari), notifikasi email |
| Pricing Page | ✅ | `app/pricing/page.tsx` | 3-tier comparison + modal input WA + Navbar |
| Subscription Page | ✅ | `app/subscription/page.tsx` | Status pembayaran, current tier, renewal date display, modal WA, Navbar |
| 3-Tier Plans | ✅ | `lib/mayar/client.ts` | Freemium (gratis), Starter (Rp49K), Pro (Rp125K) |
| Quota System | ✅ | `lib/db/schema.ts` | usageQuotas per month (prdCount, chatCount) |
| User Phone Storage | ✅ | `users.phone` | Nomor WA disimpan di DB, pre-fill saat pembayaran |
| Mayar URL Fix | ✅ | `lib/mayar/client.ts` | Base URL: `api.mayar.id/hl/v1`, endpoint: `/payment/create` |
| currentPeriodEnd | ✅ | `users.currentPeriodEnd` | Set otomatis di webhook saat payment PAID, tampil di subscription page |

**Remaining:**
- Mayar tidak mendukung pre-fill form di halaman pembayaran (batasan dari sisi Mayar)
- Mayar rate limit: 1 create payment per menit per akun

---

### 4. EXPORT & DOCUMENTATION (100% 🟢)

| Feature | Status | File/Location | Notes |
|---------|--------|---------------|-------|
| Markdown Export | ✅ | `app/page.tsx` | Copy + download `.md` |
| PDF Export | ✅ | `app/api/export/pdf/route.ts` | jsPDF (client-side) |
| Mermaid SVG/PNG Export | ✅ | `app/api/export/mermaid/route.ts` | SVG render + PNG client-side |
| README | ✅ | `README.md` | Dokumentasi lengkap: instalasi, env vars, scripts, deployment |

**Remaining:**
- Mermaid PNG server-side (saat ini SVG only, PNG client-side) - nice to have

---

### 5. NOTIFICATIONS — IN-APP (95% 🟢)

| Feature | Status | File/Location | Notes |
|---------|--------|---------------|-------|
| DB Schema | ✅ | `lib/db/schema.ts` | Tabel `notifications` |
| Notification Types | ✅ | `lib/notifications/types.ts` | Type definitions |
| Push Service | ✅ | `lib/notifications/push.ts` | CRUD + helper functions |
| Notification API | ✅ | `app/api/notifications/route.ts` | GET/POST/PATCH/DELETE |
| Notification Provider | ✅ | `components/notifications/` | Context + polling |
| Notification Bell UI | ✅ | `components/notifications/` | Icon + badge counter |
| Notification Panel | ✅ | `components/notifications/` | Dropdown list + mark read |

---

### 6. NOTIFICATIONS — EMAIL (85% 🟢)

| Feature | Status | File/Location | Notes |
|---------|--------|---------------|-------|
| Email Service | ✅ | `lib/notifications/email.ts` | Resend/SendGrid/Brevo adapter |
| Email Templates | ✅ | `lib/notifications/email.ts` | welcome, paymentSuccess, quotaWarning, passwordChanged |
| Env Config | ✅ | `.env` | `RESEND_API_KEY`, `EMAIL_PROVIDER=resend`, `EMAIL_FROM` |
| Unified Notify Helper | ✅ | `lib/notifications/notify.ts` | `notifyUser()` — kirim in-app + email sekaligus |
| Wire: Register | ✅ | `app/api/users/route.ts` | `notifyWelcome()` setelah create user |
| Wire: Payment Success | ✅ | `app/api/webhooks/mayar/route.ts` | `notifyPaymentSuccess()` di webhook PAID |
| Wire: Password Change | ✅ | `app/api/notifications/send/password-changed/route.ts` | `notifyPasswordChanged()` via endpoint |
| Wire: Quota Warning (PRD) | ✅ | `app/api/generate/stream/route.ts` | `notifyQuotaWarning()` saat quota ≥80% |
| Wire: Quota Warning (Chat) | ✅ | `app/api/chat/route.ts` | `notifyQuotaWarning()` saat quota ≥80% |
| Resend API Key | ✅ | `.env` | Teruji: email terkirim ke `digitalgrafista@gmail.com` |
| Domain Verifikasi | ⚠️ | - | Pakai `onboarding@resend.dev` (testing only). Production perlu domain sendiri |

**Remaining:**
- Verifikasi domain sendiri di Resend untuk kirim ke email selain akun Resend sendiri (production)
- `EMAIL_FROM` masih `onboarding@resend.dev` — ganti ke `noreply@domainanda.com` setelah verifikasi domain

---

### 7. SECURITY & AUTH (100% 🟢)

| Feature | Status | File/Location | Notes |
|---------|--------|---------------|-------|
| Better Auth (register/login) | ✅ | `lib/auth/index.ts` | Password di-hash internal Better Auth (scrypt), `minPasswordLength: 6` |
| Password Hash bcrypt | ✅ | `lib/auth/password.ts` | Custom API routes pakai bcrypt |
| Password Migration Script | ✅ | `scripts/migrate-passwords.ts` | Hash plaintext → bcrypt (idempotent) |
| Session Management | ✅ | `lib/auth/index.ts` | Cookie-based, 7 hari, `trustedOrigins` multi-port |
| Session Verification Helper | ✅ | `lib/auth/session.ts` | `getSessionUser()` — verifikasi session server-side untuk semua API |
| API Auth — Payment | ✅ | `app/api/payment/route.ts` | Verifikasi session via Better Auth |
| API Auth — Users | ✅ | `app/api/users/route.ts` | DELETE verifikasi session |
| API Auth — Generate | ✅ | `app/api/generate/stream/route.ts` | Verifikasi session, userId & tier dari session |
| API Auth — Chat | ✅ | `app/api/chat/route.ts` | Verifikasi session + ownership project (403) |
| API Auth — Projects | ✅ | `app/api/projects/route.ts`, `[id]/route.ts` | Verifikasi session + ownership (GET/POST/PUT/DELETE) |
| Change Password | ✅ | `app/settings/page.tsx` → Better Auth API | `authClient.changePassword()` dengan revokeOtherSessions |
| CORS Fix | ✅ | `lib/auth/index.ts`, `lib/hooks.ts` | `trustedOrigins` + auto-detect `window.location.origin` |
| Client-side Auth URL | ✅ | `lib/hooks.ts` | `authClient.baseURL` auto-detect dari `window.location.origin` |
| Error Boundary | ✅ | `components/error-boundary.tsx` | React error boundary dengan graceful error UI, integrated di layout |
| Rate Limiting (Redis) | ✅ | `lib/ai/rate-limit.ts` | Redis (ioredis) dengan fallback in-memory, atomic INCR + EXPIRE |

**Remaining:**
- (Opsional) Email verification setup (sengaja disabled untuk demo)

---

### 8. UI COMPONENTS & NAVBAR (100% 🟢)

| Feature | Status | File/Location | Notes |
|---------|--------|---------------|-------|
| shadcn/ui (new-york) | ✅ | `components/ui/` | Lengkap: button, card, dialog, badge, input, dll |
| Tailwind CSS | ✅ | `tailwind.config.ts` | Custom theme |
| BG Pattern | ✅ | `components/ui/bg-pattern.tsx` | Dots, grid, stripes |
| Auth Form | ✅ | `components/auth-form.tsx` | Login/Register toggle |
| Notification Components | ✅ | `components/notifications/` | Bell + panel |
| Landing Page | ✅ | `app/page.tsx` | Hero + PRD builder wizard + chat |
| Settings Page | ✅ | `app/settings/page.tsx` | Profile, password, usage, delete account |
| **Navbar Reusable** | ✅ | `components/navbar.tsx` | Komponen navbar mandiri (fetch session, tier, usage) |
| Navbar di semua halaman | ✅ | dashboard, pricing, subscription, settings | Lebar konsisten `max-w-[1280px]` |
| Hapus mock data | ✅ | `app/page.tsx`, `app/dashboard` | Hapus sampleProjects, getSampleProjects, mock usage, SettingsScreen, PricingScreen statis |

---

## 🚀 Recent Updates (2026-06-22)

### 1. Subscription Page — NEW
- Halaman `/subscription` untuk callback Mayar (status success/pending/failed/cancelled)
- Current tier + 3 kartu paket untuk upgrade/change
- Modal input WA + customer info (nama & email read-only)

### 2. Password Hashing dengan bcrypt — SECURITY FIX
- `lib/auth/password.ts` — utility hashPassword/verifyPassword/isBcryptHash
- Fix custom API routes: password di-hash dengan bcrypt (sebelumnya plaintext)
- Script migrasi idempotent: `scripts/migrate-passwords.ts`

### 3. API Auth Hardening — SECURITY FIX
- `lib/auth/session.ts` — helper `getSessionUser()` verifikasi session server-side
- Semua endpoint API (generate, chat, projects, payment) verifikasi session via Better Auth cookie
- Ownership project diverifikasi (403 Forbidden jika bukan owner)
- userId & tier diambil dari session/DB, bukan dari request body

### 4. Change Password Integration dengan Better Auth — FIX
- Settings page pakai `authClient.changePassword()` (Better Auth client)
- `revokeOtherSessions: true` untuk logout session lain
- Custom endpoint `/api/users/password` ditulis ulang sebagai proxy ke Better Auth

### 5. Email Notifications Wiring — NEW
- `lib/notifications/notify.ts` — helper terpadu (in-app + email sekaligus, best-effort)
- Wire ke 5 flow: register, payment success, password change, quota warning PRD & chat
- Resend API teruji: email terkirim sukses

### 6. Mayar Payment Fix — FIX
- Base URL diperbaiki: `api.mayar.id/hl/v1` (production), `api.mayar.club/hl/v1` (sandbox)
- Endpoint diperbaiki: `POST /payment/create` (bukan `/payments`)
- Response mapping: `data.link` untuk payment URL
- Field request: `name`, `amount`, `redirectUrl`, `customerName`, `customerEmail`, `customerPhone`
- Error handling: non-JSON response, timeout, rate limit
- `MAYAR_MODE=production` (sandbox sedang down)

### 7. Modal Pembayaran dengan Input WA — NEW
- Modal di pricing & subscription page: tampilkan nama & email (read-only), input WA
- Phone disimpan ke `users.phone` di DB
- `customerName`, `customerEmail`, `customerPhone` dikirim ke Mayar API
- Catatan: Mayar tidak mendukung pre-fill form di halaman pembayaran (batasan Mayar)

### 8. CORS Fix — FIX
- `trustedOrigins` di Better Auth: `localhost:3000`, `localhost:3001`, env URLs
- `authClient.baseURL` auto-detect dari `window.location.origin` (support port dinamis)

### 9. Password Policy Fix — FIX
- `passwordPolicy.minLength` (tidak dibaca Better Auth) → `minPasswordLength: 6` (properti yang benar)
- Password 6 karakter sekarang diterima

### 10. Hapus Semua Mock Data — CLEANUP
- Hapus `sampleProjects` (5 project hardcoded) → fetch dari `/api/projects`
- Hapus `getSampleProjects()` fallback di dashboard → empty state
- Hapus mock usage data (`prdUsage: 1, chatUsage: 13`) → fetch dari `/api/users/usage`
- Hapus `SettingsScreen` statis (mock avatar, mock save) → redirect ke `/settings`
- Hapus `PricingScreen` statis (hardcoded `current: true` di Starter) → redirect ke `/pricing`
- Hapus `PaywallDialog` mock text → tombol "Lihat Paket" ke `/pricing`
- Tier di navbar/pricing/subscription fetch dari server (tidak dari cache session)

### 11. Navbar Reusable di Semua Halaman — NEW
- `components/navbar.tsx` — komponen navbar mandiri (fetch session, tier, usage sendiri)
- Fitur: logo SpecFlow, badge PRD usage, tombol Dashboard, notification bell, tombol Upgrade, user menu (avatar, tier badge, chat credits, dropdown)
- Dipasang di: dashboard, pricing, subscription, settings
- Lebar konsisten `max-w-[1280px]` di semua halaman (terpisah dari container konten)
- Hapus tombol "Kembali ke Dashboard" di pricing & subscription (sudah ada navbar)

---

## 📋 ANALYTICS & MONITORING (100% 🟢)

| Feature | Status | File/Location | Notes |
|---------|--------|---------------|-------|
| PostHog Config | ✅ | `lib/analytics/posthog.ts` | Analytics config dengan common events (SIGN_UP, PRD_COMPLETED, dll) |
| PostHog Provider | ✅ | `components/analytics/posthog-provider.tsx` | Client-side PostHog provider + page view tracker |
| Sentry Config | ✅ | `lib/monitoring/sentry.ts` | Error monitoring dengan captureException/captureMessage |
| Environment Variables | ✅ | `.env.example` | POSTHOG_KEY, POSTHOG_HOST, SENTRY_DSN, SENTRY_AUTH_TOKEN |

---

## ⚠️ Yang Masih Harus Dikembangkan

### 🔴 Prioritas Tinggi (Production Blocker)

| # | Issue | Detail | Estimasi |
|---|-------|--------|----------|
| 1 | **Domain email sendiri** | Beli & verifikasi domain di Resend. Tanpa ini, email hanya terkirim ke email akun Resend sendiri. Set `EMAIL_FROM=noreply@domainanda.com` | 1 hari |
| 2 | **Deploy ke production** | Deploy Next.js ke Vercel/ Railway. Set semua env vars production. Pastikan webhook Mayar URL mengarah ke domain production | 1-2 hari |
| 3 | **Webhook Mayar production** | Set webhook URL di dashboard Mayar ke `https://domainanda.com/api/webhooks/mayar`. Test end-to-end payment flow | 0.5 hari |

### 🟡 Prioritas Sedang (Peningkatan)

| # | Issue | Detail | Estimasi |
|---|-------|--------|----------|
| 4 | **PostgreSQL migration (production)** | Saat ini config sudah siap. Perlu: setup database (Neon/Supabase), run `npm run migrate:postgres`, set `DATABASE_PROVIDER=postgresql` | 1 hari |
| 5 | **Redis setup (production)** | Saat ini config sudah siap dengan fallback in-memory. Perlu: setup Redis (Upstash/Redis Cloud), set `REDIS_URL` | 0.5 hari |
| 6 | **PostHog + Sentry setup** | Config sudah siap. Perlu: signup PostHog/Sentry, set env vars, test integration | 0.5 hari |

### 🟢 Prioritas Rendah (Nice to Have)

| # | Issue | Detail | Estimasi |
|---|-------|--------|----------|
| 10 | **Automated tests** | Setup Vitest/Jest + React Testing Library. Test API endpoints, auth flow, payment flow, quota system | 2-3 hari |
| 11 | **Mermaid PNG server-side** | Saat ini SVG only. Tambah puppeteer/playwright untuk render PNG di server | 0.5 hari |
| 12 | **Email verification** | Enable `requireEmailVerification` di Better Auth. Set `sendVerificationEmail` dengan Resend template | 0.5 hari |
| 13 | **OAuth login** | Google/GitHub login via Better Auth. Tambah provider di `lib/auth/index.ts` | 1 hari |
| 14 | **Penghapusan `cookies.txt`** | File debug di root project, bisa dihapus | 5 menit |
| 15 | **Admin dashboard** | Halaman admin untuk manage users, melihat transactions, manual upgrade tier | 2-3 hari |
| 16 | **Multi-bahasa (i18n)** | Support English & Indonesia. Pakai `next-intl` atau `next-i18next` | 2-3 hari |

---

## 🛠 Tech Stack

| Kategori | Teknologi |
|----------|-----------|
| Framework | Next.js 15.1.3 (App Router) + React 19 |
| Bahasa | TypeScript 5.7.2 (strict) |
| Database | better-sqlite3 (default) + PostgreSQL (via @neondatabase/serverless) + Drizzle ORM |
| Rate Limiting | ioredis (Redis) dengan fallback in-memory |
| Auth | Better Auth (email/password, session 7 hari, minPasswordLength 6) + bcrypt + session verification |
| AI | Anthropic Claude 3.5 Sonnet + OpenAI GPT-4o (fallback) |
| Payment | Mayar.id (production mode, endpoint `/payment/create`) |
| UI | shadcn/ui (new-york) + Tailwind CSS + lucide-react + sonner |
| Export | jsPDF (PDF), Mermaid.js (diagram), react-markdown |
| Email | Resend (free tier 100/hari) — wired ke 5 flow |
| Analytics | PostHog (optional) — product analytics |
| Monitoring | Sentry (optional) — error monitoring |
| Error Handling | React Error Boundary (`components/error-boundary.tsx`) |
| Navbar | Reusable component (`components/navbar.tsx`) — mandiri, fetch data sendiri |

---

## 🔐 Environment Variables Checklist

```bash
# Required (Core)
✅ BETTER_AUTH_SECRET
✅ BETTER_AUTH_URL
✅ NEXT_PUBLIC_URL

# Database (Optional, default SQLite)
⚠️ DATABASE_URL (PostgreSQL connection string, e.g., Neon/Supabase)
⚠️ DATABASE_PROVIDER (postgresql or sqlite, default: sqlite)

# AI (minimal salah satu)
⚠️ ANTHROPIC_API_KEY (Claude 3.5 Sonnet)
⚠️ OPENAI_API_KEY (GPT-4o)

# Mayar Payment
✅ MAYAR_API_KEY
✅ MAYAR_WEBHOOK_TOKEN
✅ MAYAR_MODE (production)

# Email (Resend)
✅ EMAIL_PROVIDER (resend)
✅ RESEND_API_KEY
✅ EMAIL_FROM (onboarding@resend.dev — testing; ganti ke domain sendiri untuk production)

# Rate Limiting (Optional, default in-memory)
⚠️ REDIS_URL (Redis connection string, e.g., Upstash/Redis Cloud)

# Analytics & Monitoring (Optional)
⚠️ NEXT_PUBLIC_POSTHOG_KEY
⚠️ NEXT_PUBLIC_POSTHOG_HOST
⚠️ SENTRY_DSN
⚠️ SENTRY_AUTH_TOKEN
```

---

## 📝 Notes

- **API Security:** Semua API endpoint krusial memverifikasi session via Better Auth cookie. userId & tier diambil dari session/DB. Ownership project diverifikasi (403 Forbidden).
- **Password Security:** Custom API routes pakai bcrypt. Better Auth hash password sendiri (scrypt). Change password via Better Auth API.
- **CORS:** `trustedOrigins` mendukung multi-port. Client auto-detect `window.location.origin`.
- **Mayar Payment:** URL & endpoint sudah benar (`api.mayar.id/hl/v1/payment/create`). Customer data (nama, email, phone) dikirim ke Mayar. currentPeriodEnd di-set otomatis (+30 hari). Mayar tidak mendukung pre-fill form (batasan Mayar). Rate limit: 1 payment/min.
- **No Mock Data:** Semua data sekarang real dari database/API. Tidak ada lagi hardcoded sample projects, mock usage, atau static screens.
- **Navbar:** Reusable component di semua halaman (dashboard, pricing, subscription, settings). Lebar konsisten `max-w-[1280px]`.
- **Email:** Resend ter-wire ke 5 flow. Pakai `onboarding@resend.dev` (testing only). Production perlu domain sendiri.
- **Database:** SQLite (default) + PostgreSQL (via DATABASE_URL). Kolom `phone` dan `currentPeriodEnd` di tabel users.
- **Rate Limiting:** Redis (via REDIS_URL) dengan fallback in-memory. Atomic INCR + EXPIRE untuk consistency.
- **Error Handling:** React Error Boundary di layout untuk graceful error handling.
- **Analytics & Monitoring:** PostHog untuk analytics, Sentry untuk error monitoring. Keduanya optional, config sudah siap.

---

*Last Updated: 2026-06-22 (Update 2)*
