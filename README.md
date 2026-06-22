# SpecFlow

AI-powered PRD (Product Requirements Document) generator that helps teams create comprehensive product specifications in minutes.

## 🚀 Features

- **AI-Generated PRD**: Generate professional PRD documents using Claude 3.5 Sonnet or GPT-4o
- **Interactive Builder**: Step-by-step wizard with context gathering and tech stack selection
- **AI Chat Agent**: Refine and iterate on your PRD with AI-powered chat
- **Multiple Export Formats**: Markdown, PDF, and Mermaid diagrams (SVG/PNG)
- **Project History**: Track all your projects with version comparison
- **Tiered Subscription**: Freemium, Starter, and Pro plans with usage quotas
- **Secure Authentication**: Better Auth with email/password and session management
- **Notifications**: In-app notifications + email notifications for key events

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn or pnpm
- SQLite (included, no setup needed)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ardika08/specflow.git
   cd specflow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Configure your `.env` file** (see [Environment Variables](#environment-variables))

5. **Run database migrations**
   ```bash
   npm run db:push
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔐 Environment Variables

Create a `.env` file in the root directory with the following variables:

### Required (Core)

```bash
# Better Auth
BETTER_AUTH_SECRET=your-random-secret-string-min-32-chars
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_URL=http://localhost:3000
```

### Required (AI - at least one)

```bash
# Anthropic Claude (recommended)
ANTHROPIC_API_KEY=your-anthropic-api-key

# OR OpenAI GPT
OPENAI_API_KEY=your-openai-api-key
```

### Required (Payment - Mayar.id)

```bash
MAYAR_API_KEY=your-mayar-api-key
MAYAR_WEBHOOK_TOKEN=your-mayar-webhook-token
MAYAR_MODE=production  # or 'sandbox'
```

### Required (Email - Resend)

```bash
EMAIL_PROVIDER=resend
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=noreply@yourdomain.com  # or onboarding@resend.dev for testing
```

### Optional

```bash
# Redis for rate limiting (production)
REDIS_URL=your-redis-url

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=your-posthog-key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Error monitoring
SENTRY_DSN=your-sentry-dsn
SENTRY_AUTH_TOKEN=your-sentry-auth-token
```

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push database schema (SQLite) |
| `npm run db:migrate` | Run database migrations |
| `npm run db:studio` | Open Drizzle Studio |

## 🏗️ Architecture

### Tech Stack

- **Framework**: Next.js 15.1.3 with App Router
- **Language**: TypeScript 5.7.2
- **Database**: SQLite + Drizzle ORM
- **Authentication**: Better Auth
- **AI**: Anthropic Claude 3.5 Sonnet + OpenAI GPT-4o (fallback)
- **Payment**: Mayar.id
- **Email**: Resend
- **UI**: shadcn/ui + Tailwind CSS

### Project Structure

```
specflow/
├── app/                      # Next.js App Router pages
│   ├── api/                  # API routes
│   │   ├── auth/            # Better Auth endpoints
│   │   ├── chat/            # AI chat API
│   │   ├── generate/        # PRD generation
│   │   ├── projects/        # Project CRUD
│   │   ├── payment/         # Mayar payment
│   │   ├── webhooks/        # Webhook handlers
│   │   └── users/           # User management
│   ├── dashboard/           # Dashboard page
│   ├── pricing/             # Pricing page
│   ├── subscription/        # Subscription management
│   ├── settings/           # User settings
│   └── page.tsx            # Landing page
├── components/              # React components
│   ├── ui/                 # shadcn/ui components
│   ├── navbar.tsx          # Reusable navbar
│   └── notifications/      # Notification components
├── lib/                    # Utility libraries
│   ├── auth/              # Better Auth config
│   ├── ai/                # AI client & rate limiting
│   ├── db/                # Database schema & client
│   ├── mayar/             # Mayar payment client
│   ├── notifications/     # Notification services
│   └── hooks.ts           # Custom React hooks
└── middleware.ts           # Next.js middleware
```

### Database Schema

- **users**: User profiles, tier, quota
- **sessions**: Better Auth sessions
- **accounts**: OAuth accounts
- **projects**: PRD projects with generated content
- **projectMessages**: Chat history for revisions
- **usageQuotas**: Monthly usage tracking
- **notifications**: In-app notifications

## 💳 Pricing Plans

| Plan | Price | PRD/month | Chat/month | Features |
|------|-------|-----------|------------|----------|
| **Freemium** | Free | 1 | Limited | Basic models, no export |
| **Starter** | Rp49.000 | 5 | 100 | High-end models, all exports, project history |
| **Pro** | Rp125.000 | Unlimited | Unlimited | Priority processing, priority support |

## 🚀 Deployment

### Vercel (Recommended)

1. **Push your code to GitHub**

2. **Import project to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure environment variables

3. **Set environment variables in Vercel**
   Add all the variables from your `.env` file

4. **Set up Mayar webhook**
   - Login to [Mayar Dashboard](https://dashboard.mayar.id)
   - Set webhook URL to: `https://yourdomain.com/api/webhooks/mayar`
   - Select events: `PAID`, `FAILED`, `EXPIRED`

5. **Deploy**
   - Vercel will auto-deploy on push
   - Check the deployment logs for any issues

### Railway

1. **Create a new project on Railway**
2. **Add PostgreSQL database** (optional, for production)
3. **Set environment variables**
4. **Deploy from GitHub**
5. **Configure Mayar webhook** to your Railway domain

### Manual (VPS)

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Set up production environment**
   ```bash
   cp .env.example .env.production
   # Edit .env.production with production values
   ```

3. **Start the server**
   ```bash
   npm run start
   # Or use PM2
   pm2 start npm --name "specflow" -- start
   ```

4. **Set up reverse proxy** (nginx recommended)

5. **Configure SSL** (Let's Encrypt recommended)

## 🔒 Security

- **Password Hashing**: bcrypt for custom API routes, scrypt for Better Auth
- **Session Management**: 7-day expiry, server-side verification
- **API Authentication**: All protected endpoints verify session
- **Rate Limiting**: Per-minute and daily limits on AI endpoints
- **Webhook Verification**: HMAC-SHA256 signature verification

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For support, email support@specflow.id or join our Discord community.
