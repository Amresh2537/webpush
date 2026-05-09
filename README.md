# NotifyFlow

NotifyFlow is a web push notification SaaS built with Next.js 14 App Router.

## Stack

- Next.js 14 (App Router + TypeScript + src/)
- Tailwind CSS + shadcn-style UI primitives
- Prisma ORM + PostgreSQL
- NextAuth.js (credentials auth)
- Redis + BullMQ queue processing
- web-push for VAPID-based delivery
- Stripe checkout endpoint for Pro plan upgrades
- Recharts for dashboard analytics

## Core Features Implemented

- Email/password signup and login
- Email verification flow via tokenized link
- Free plan subscriber cap (1,000)
- Website management (domain, logo, VAPID key pair)
- Website ownership verification (meta tag or DNS TXT)
- Installable SDK snippet generator
- Subscriber ingestion endpoint (`/api/collect`)
- Manual broadcast campaign creation with segmentation
- Immediate send or scheduled send
- Queue-backed push worker with:
  - 100 notifications/second throttling
  - 3 retries via BullMQ
- Campaign stats tracking (sent/delivered/clicked/failed)
- Dashboard metrics + 7-day chart

## Project Structure

- `src/app/` routes and API routes
- `src/actions/` server actions
- `src/components/` UI + feature components
- `src/lib/` services, auth, analytics, queue, push, validators
- `src/worker/` BullMQ worker
- `prisma/` schema and initial migration

## Environment Setup

1. Copy env template:

```bash
cp .env.example .env
```

2. Update values in `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/notifyflow?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-a-strong-secret"
REDIS_URL="redis://localhost:6379"
STRIPE_SECRET_KEY="sk_test_replace"
STRIPE_WEBHOOK_SECRET="whsec_replace"
VAPID_SUBJECT="mailto:support@notifyflow.dev"
APP_URL="http://localhost:3000"
```

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Generate Prisma client and run migrations:

```bash
npm run db:generate
npm run db:migrate
```

3. Start Next.js app:

```bash
npm run dev
```

4. Start queue worker in another terminal:

```bash
npm run worker
```

## Email Verification (Dev)

- On signup, a verification URL is logged to server console.
- Open that link to verify email.

## SDK Installation

After adding and verifying a website, open website detail page and copy the generated snippet.

The snippet:
- Registers service worker (`/notifyflow-sw.js`)
- Requests notification permission
- Subscribes with website-specific VAPID public key
- Sends subscription data to `/api/collect`

## Campaign Click Tracking

- Worker includes campaign id in notification payload.
- Service worker opens `/api/campaigns/:campaignId/click`.
- Click endpoint increments `clickedCount` and redirects to campaign click URL.

## Build and Checks

```bash
npm run lint
npm run build
```

## Notes

- Stripe checkout route is scaffolded at `/api/billing/checkout` with inline test price data.
- Current email verification is console-based (no SMTP integration yet).
- Worker must be running for scheduled/immediate campaigns to process.
