# CareNest — deployment and migration guide

## 1. Prerequisites

- Node.js 20 LTS (or 22) and npm 10
- PostgreSQL 15+ (production) — SQLite is used only for zero-setup local development
- HTTPS termination (reverse proxy, load balancer or platform-managed TLS)
- Optional: a Stripe account, Resend (or SMTP) credentials, a Cloudinary account, a Google Maps key, a Redis instance

## 2. Environment

Copy `.env.example` to `.env` and fill it in. Never commit `.env`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string in production |
| `AUTH_SECRET` | yes | 32+ random bytes; session and token signing (`openssl rand -base64 48`) |
| `NEXT_PUBLIC_APP_URL` | yes | Public origin used for canonical URLs, email links and Stripe redirects |
| `SESSION_TTL_DAYS` | no | Session lifetime, default 30 |
| `RESEND_API_KEY`, `EMAIL_FROM` | no | Transactional email via Resend |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` | no | SMTP fallback when Resend is not configured |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*` | no | Real billing; without them the app runs a clearly-labelled sandbox |
| `CLOUDINARY_*` | no | Remote uploads; without them files are stored privately on the server |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | no | Maps on profiles and job pages |
| `REDIS_URL` | no | Shared rate limiting and a Redis-backed event bus |
| `PLATFORM_FEE_BPS` | no | Default platform fee in basis points (seeded into settings) |

## 3. Database migration

### Local development (SQLite, no server)

```bash
npm install
npm run setup        # generate + db push + seed
```

### Production (PostgreSQL)

```bash
export DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/carenest?schema=public"
npm run db:use-postgres      # rewrites prisma/schema.prisma provider to "postgresql"
npx prisma migrate dev --name init   # once, locally, to create prisma/migrations
```

Commit `prisma/migrations`. On every deploy run:

```bash
npx prisma migrate deploy
npx prisma generate
```

`prisma migrate deploy` is idempotent and safe to run on each release. Do not use `db push` in production.

### Moving data from SQLite

The schema is provider-neutral, so a re-seed is usually enough for demo data. To keep real rows, export each table to CSV/JSON and import with a small Prisma script (table order matters: User → profiles → categories → jobs → applications → conversations/messages → reviews → subscriptions/payments). Keep integer cents unchanged.

## 4. Build and run

```bash
npm ci
npx prisma migrate deploy
npm run build
npm start           # Node server on PORT (default 3000)
```

The app is a long-running Node server (not static export). It needs:

- A writable directory for local uploads when Cloudinary is not configured (`UPLOAD_DIR`, default `./.uploads`). On ephemeral filesystems, configure Cloudinary or an object store.
- Support for streaming responses if you want realtime messaging (`/api/stream`, SSE). Disable proxy buffering for that route (nginx: `proxy_buffering off;`).
- Sticky sessions **only** if you scale horizontally; otherwise the in-process event bus delivers events per instance. For multi-instance deployments set `REDIS_URL` and replace the bus in `lib/events.ts` with Redis pub/sub (subscribe per instance, publish on write).

## 5. HTTPS and headers

Terminate TLS at the proxy and forward `X-Forwarded-Proto`. Security headers are set in `next.config.mjs`; keep `X-Frame-Options: DENY` and the CSP-safe defaults. Cookies are `HttpOnly`, `SameSite=Lax` and marked `Secure` when the request is HTTPS.

## 6. Stripe

1. Create products/prices for each paid plan and copy the price ids into `STRIPE_PRICE_*` (or store them in the plan rows).
2. Add the webhook endpoint `https://YOUR_DOMAIN/api/webhooks/stripe` with events `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`.
3. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
4. Verify: complete a test-mode checkout and confirm `Subscription`, `Payment` and `Invoice` rows, then cancel and confirm the status updates.

Without these steps the app never pretends billing is live: it creates a sandbox subscription and labels it in the UI.

## 7. Email

Set `RESEND_API_KEY` and a verified `EMAIL_FROM` domain, or SMTP variables. Send a test through the forgot-password flow. With no provider configured, emails are logged and notifications still persist — the UI is unaffected.

## 8. Seed and admin

`npm run db:seed` is idempotent. It creates demo users with the shared password `Password123!`. In production:

1. Do not run the seed, or run it once in staging with demo data.
2. Create the first admin directly in the database (`role = 'ADMIN'`, bcrypt password hash) or by promoting a registered user, then sign in and rotate the password.

## 9. Health checks and monitoring

- Readiness: `GET /` returns 200 and renders the homepage from the database.
- Liveness: any static asset or `GET /api/auth/session` (returns `{"ok":true,"data":{"user":null}}` when signed out).
- Logs: JSON errors are emitted by `lib/api.ts`; watch for `429` spikes (rate limits) and `500`s from Prisma connection exhaustion.
- Database: back up nightly; keep `prisma/migrations` under version control.

## 10. Release checklist

- [ ] `npm run typecheck` and `npm test` pass
- [ ] `npm run build` passes
- [ ] `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL` set
- [ ] `npx prisma migrate deploy` applied
- [ ] Uploads storage configured (Cloudinary or persistent volume)
- [ ] Stripe webhook reachable and signing secret set (if billing is live)
- [ ] Email provider verified (if email is live)
- [ ] Admin account created and demo passwords removed
- [ ] `robots.txt` and sitemap reachable; canonical URL correct
- [ ] Backups and error monitoring enabled
