# CareNest

A full-stack caregiver marketplace: families post care jobs, caregivers build verified profiles and apply, agencies manage rosters, and admins moderate the whole platform. Built with Next.js App Router, TypeScript, Prisma and Tailwind.

> Branding, copy, code and assets are original. The product category is inspired by care marketplaces such as Care.com; no third-party code, copy or logos are used.

---

## Contents

1. [What's included](#whats-included)
2. [Quick start](#quick-start)
3. [Demo accounts](#demo-accounts)
4. [Architecture](#architecture)
5. [Roles and permissions](#roles-and-permissions)
6. [Feature map](#feature-map)
7. [Data model](#data-model)
8. [Payments and plans](#payments-and-plans)
9. [Messaging and realtime](#messaging-and-realtime)
10. [Verification and trust](#verification-and-trust)
11. [Notifications and email](#notifications-and-email)
12. [Security](#security)
13. [SEO and content](#seo-and-content)
14. [Scripts](#scripts)
15. [Testing](#testing)
16. [Third-party integrations](#third-party-integrations)
17. [Switching the database to PostgreSQL](#switching-the-database-to-postgresql)
18. [Deployment](#deployment)
19. [Project structure](#project-structure)

---

## What's included

- **22 public pages**: home, 7 category landing pages, search, caregiver profiles, care jobs and job detail, nanny/babysitting job boards, pricing, locations index and city pages, blog index and post pages, about, how-it-works, safety, contact, help centre, plus CMS-driven pages, 404/500 and sitemap/robots.
- **Database-backed search** with filters (category, city/state/ZIP, rate, availability, experience, languages, badges), sorting and pagination. No placeholder or faked results: every card comes from Prisma.
- **Four role dashboards** (family, caregiver, agency, admin) with role-scoped navigation and RBAC enforced on the server.
- **Job lifecycle**: draft → published → paused → closed, applications (submitted → under review → shortlisted → interview → hired/rejected/withdrawn), interviews, hire confirmation.
- **Messaging** with conversations, read receipts, SSE realtime updates and unread counts.
- **Verified reviews**: only a family with a confirmed hire can review that caregiver, once per hire; ratings recalculate; admins moderate.
- **Layered verification**: identity, background check, qualifications and references are separate checks with their own badges; documents are private.
- **Configurable subscription plans**: prices, limits and features live in the database and are edited in the admin panel (no hardcoded prices).
- **Admin**: overview metrics, user suspension, verification queue, safety reports, review moderation, job moderation, plans, CMS content, platform settings, audit log.
- REST API with Zod validation, same-origin CSRF checks, rate limiting, audit logging.

## Quick start

```bash
npm install
cp .env.example .env        # then edit AUTH_SECRET (openssl rand -base64 48)
npm run setup               # prisma generate + db push + seed
npm run dev                 # http://localhost:3000
```

`npm run setup` creates a local SQLite database at `prisma/dev.db` and seeds demo data. No Docker and no database server are required for local development.

Requirements: Node.js 20+ and npm.

## Demo accounts

All demo accounts use the password `Password123!`.

| Role | Email |
| --- | --- |
| Admin | `admin@carenest.dev` |
| Family | `sarah@carenest.dev` |
| Caregiver | `amelia@carenest.dev` |
| Agency | `agency@carenest.dev` |

The seed creates 15 users, 12 caregiver profiles, 10 jobs, plans, CMS pages, FAQs, blog posts, testimonials and reviews. It is idempotent: re-running it will not duplicate rows.

## Architecture

```
Browser ── Next.js App Router (server components read Prisma directly)
        └─ REST route handlers under app/api/** (mutations, JSON)
              ├─ lib/validators.ts   Zod schemas (shared with forms)
              ├─ lib/rbac.ts         role + ownership guards
              ├─ lib/auth.ts         session cookie → user
              ├─ lib/api.ts          handler wrapper, JSON errors, same-origin check
              ├─ lib/events.ts       in-process event bus feeding SSE
              └─ Prisma → SQLite (dev) / PostgreSQL (prod)
```

- **Reads** happen in server components via Prisma: fast, typed, no client fetching waterfalls.
- **Writes** go through REST handlers so validation, CSRF, rate limiting and audit logging live in one place.
- **Realtime** uses an in-process bus plus `GET /api/stream` (Server-Sent Events). It works on a single Node server. For multi-instance deployments, swap the bus in `lib/events.ts` for Redis pub/sub (the Redis client is already wired in `lib/rate-limit.ts` when `REDIS_URL` is set).
- **Money** is stored as integer cents (`Int`) everywhere. Currency formatting happens in `lib/utils.ts`.

## Roles and permissions

| Capability | Family | Caregiver | Agency | Admin |
| --- | --- | --- | --- | --- |
| Search caregivers, save profiles | ✅ | ✅ | ✅ | ✅ |
| Post and edit jobs | ✅ | – | ✅ (roster) | ✅ (moderate) |
| Apply to jobs | – | ✅ | – | – |
| Message, interview, hire | ✅ | ✅ | ✅ | – |
| Review a caregiver | ✅ (after hire) | – | – | – |
| Submit verification | ✅ (identity) | ✅ | ✅ (licence) | – |
| Moderate users, content, reports | – | – | – | ✅ |
| Edit plans and platform settings | – | – | – | ✅ |

Enforcement is server-side in `lib/rbac.ts` and `lib/auth.ts` (`requireUser`, `requireRole`, ownership checks on every job/application/conversation/review/document). Client-side route guards are convenience only.

## Feature map

| Area | Where |
| --- | --- |
| Homepage, marketing sections | `app/(site)/page.tsx`, `components/marketing/*` |
| Category landing pages | `app/(site)/find-*`, `lib/category-routes.ts` |
| Search | `app/(site)/search`, `lib/search.ts`, `components/marketplace/*` |
| Caregiver profile | `app/(site)/caregivers/[slug]` |
| Jobs board + detail | `app/(site)/care-jobs`, `app/(site)/care-jobs/[slug]` |
| Nanny / babysitting jobs | `app/(site)/nanny-jobs`, `app/(site)/babysitting-jobs` |
| Pricing | `app/(site)/pricing`, plans read from the database |
| Blog / locations / CMS | `app/(site)/blog`, `app/(site)/locations`, `app/(site)/[slug]` |
| Auth | `app/(auth)/*`, `app/api/auth/*` |
| Family dashboard | `app/dashboard/family/*` |
| Caregiver dashboard | `app/dashboard/caregiver/*` |
| Agency dashboard | `app/dashboard/agency/*` |
| Admin | `app/dashboard/admin/*` |
| Shared dashboard | messages, saved, notifications, interviews, subscription, verification, settings |

## Data model

Normalized PostgreSQL/SQLite schema (`prisma/schema.prisma`, ~45 models). Highlights:

- **User** — single account table with `role` (FAMILY, CAREGIVER, AGENCY, ADMIN), status, email verification, timezone, soft delete.
- **FamilyProfile**, **CaregiverProfile**, **AgencyProfile** — one-to-one with `User`. Caregiver profiles carry headline, bio, rate (cents), experience, availability, languages, skills, certifications, photo, location, rating aggregates and the four verification timestamps.
- **CareJob** — owned by a family or agency, category, schedule, pay range, requirements, status, slug, view counts.
- **JobApplication** — unique per (job, caregiver), status, cover note, hire timestamp; **Interview** — scheduling between family and caregiver with status and notes.
- **Conversation / ConversationParticipant / Message / MessageRead** — read receipts per participant.
- **Review** — linked to a hired application, unique per author/application, rating, moderation status, caregiver response.
- **VerificationRequest / Document** — private uploads, review decisions, reviewer notes.
- **SubscriptionPlan / Subscription / Payment / Invoice** — plan rows are admin-editable; subscriptions track provider ids; payments/invoices store integer cents.
- **Notification / NotificationPreference / EmailTemplate** — in-app and email delivery, per-user preferences.
- **Report / AdminAuditLog / PlatformSetting / CMSPage / BlogPost / FAQ / Testimonial / Location / CareCategory / SavedCaregiver / SavedJob**.

Conventions that keep the schema database-portable: string enums (validated with Zod), integer cents, JSON stored as text and parsed via `lib/json.ts`.

## Payments and plans

Plans are rows in `SubscriptionPlan` (audience, monthly/annual price in cents, search/application/contact/job limits, features, trial days, active/popular flags). The public pricing page and the dashboards read them from the database, and admins edit them at `/dashboard/admin/plans`.

`lib/subscription.ts` handles checkout and cancellation:

- With `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` set, checkout creates a real Stripe Checkout Session and the webhook (`/api/webhooks/stripe`) verifies the signature and writes subscription, payment and invoice rows.
- Without keys, the app creates a clearly-labelled **sandbox subscription** so the flow is testable end to end. No card data is collected and nothing is charged. The UI states that billing is in sandbox mode.

Billing enforcement (limits by plan) is read from the subscription when an action is attempted; free plans fall back to `limits.*` platform settings.

## Messaging and realtime

- Conversations are created from a caregiver profile ("Message") or from an application.
- Messages are written through `POST /api/conversations/[id]/messages`; the handler validates membership, checks the per-minute rate limit, persists the message, emits an event, and returns it.
- `GET /api/stream` (SSE) pushes `message`, `notification` and `read` events to the signed-in participant. The chat UI reconciles by message id and re-fetches on reconnect, so a missed event never loses history.
- Read receipts are stored per participant (`MessageRead`) and shown as "Seen" in the thread.
- Short polling fallback is not needed while SSE is connected; the server sends a heartbeat comment every 25 s to keep proxies from closing the stream.

## Verification and trust

Four independent checks on caregiver profiles (identity, background check, qualifications, references) plus an agency licence check. Each `VerificationRequest` is reviewed by an admin; approval sets the matching timestamp on the profile, which is the only source of the badge. Documents upload through `POST /api/uploads` with a private visibility flag and are served by `GET /api/files/[id]` only to the owner or an admin.

Badges displayed publicly: Identity verified, Background checked, Credentials verified, References verified, Agency licensed. Nothing is shown as verified before an actual approval.

## Notifications and email

- `Notification` rows drive the bell menu, the notifications page and unread counts.
- `NotificationPreference` controls email categories and in-app delivery, edited at `/dashboard/settings`.
- Email goes through Resend when `RESEND_API_KEY` is set, else SMTP when `SMTP_HOST` is set, else a development transport that logs the message (and still stores a notification). Templates live in `EmailTemplate` and are rendered with `{{variable}}` substitution in `lib/email.ts`.
- Auth emails: verification and password reset tokens are single-use, hashed at rest and expiring (see `lib/tokens.ts`).

## Security

- **Passwords**: bcrypt hashes (cost 12); password change requires the current password and revokes other sessions.
- **Sessions**: opaque random tokens in an HttpOnly, SameSite=Lax cookie; only a SHA-256 hash is stored in the database; suspension and password changes invalidate sessions.
- **CSRF**: every mutating API route calls `assertSameOrigin`, rejecting cross-origin requests. Cookies are not used for third-party frames.
- **Rate limiting**: per-IP and per-user buckets in `lib/rate-limit.ts` (in-memory by default, Redis when `REDIS_URL` is set) on login, registration, password reset, messages, applications, reports and uploads.
- **Uploads**: type and size validation, generated file names, private-by-default storage.
- **Webhooks**: Stripe signatures verified against the raw body.
- **Input**: every handler parses with Zod; Prisma parameterizes SQL.
- **RBAC**: every privileged read and write re-checks the role and resource ownership server-side.
- **Audit**: admin actions and sensitive changes write to `AdminAuditLog`.
- **Headers**: security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) configured in `next.config.mjs`.

## SEO and content

- Per-page metadata via `lib/seo.ts` (title, description, canonical, Open Graph, Twitter).
- JSON-LD: Organization + WebSite on the home page, Person/Service on caregiver profiles, JobPosting on job details, Article on blog posts, BreadcrumbList on deep pages, FAQPage on the help centre.
- `app/sitemap.ts` and `app/robots.ts` generate from the database (published caregivers, jobs, blog posts, CMS pages, locations).
- CMS pages (`CMSPage`) render Markdown from the admin panel, with optional footer links and per-page SEO fields.
- Blog (`BlogPost`) with drafts, publish dates and categories; testimonials and FAQs seeded and queryable.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest suite |
| `npm run setup` | Generate client, push schema, seed (first run) |
| `npm run db:push` | Sync schema without migrations (dev/SQLite) |
| `npm run db:migrate` | Create a migration (PostgreSQL) |
| `npm run db:seed` | Re-run the idempotent seed |
| `npm run db:reset` | Reset the database and reseed |
| `npm run db:use-postgres` | Switch `schema.prisma` provider to PostgreSQL |

## Testing

```bash
npm test
```

Tests cover pure business logic: money formatting, plan limit evaluation, search filter parsing, review eligibility, RBAC helpers and JSON helpers. They run without a database. The full checklist of what was and was not verified lives at the end of this repository's delivery notes.

## Third-party integrations

Every integration is optional and degrades gracefully, and each one is honest about its state in the UI:

| Integration | Env vars | Without keys |
| --- | --- | --- |
| Stripe billing | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*` | Labelled sandbox subscription, no charges |
| Resend email | `RESEND_API_KEY`, `EMAIL_FROM` | Console/log transport + stored notifications |
| SMTP email | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` | Falls back to log transport |
| Cloudinary uploads | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Local private storage under `/api/files/[id]` |
| Google Maps | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Static location text and a graceful map placeholder |
| Redis | `REDIS_URL` | In-memory rate limiting and event bus |

Nothing here claims to be live-tested without credentials: the code paths exist, the keyless fallbacks are real, and each UI surface labels the mode.

## Switching the database to PostgreSQL

SQLite is the zero-setup local default. The schema avoids provider-specific features, so switching is two steps:

1. Set `DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/carenest?schema=public"` in `.env`.
2. Run:

```bash
npm run db:use-postgres     # rewrites the datasource provider to "postgresql"
npm run db:migrate -- --name init
npm run db:seed
```

To move existing SQLite data, export the tables you need or simply re-seed into PostgreSQL. See `docs/DEPLOYMENT.md` for details.

## Deployment

1. Provision PostgreSQL and set `DATABASE_URL`.
2. Set `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL` and any integration keys.
3. `npm ci && npm run db:use-postgres && npx prisma migrate deploy && npm run build`.
4. Start with `npm start` (Node 20+) behind HTTPS.
5. Point the Stripe webhook at `https://YOUR_DOMAIN/api/webhooks/stripe`.
6. Run `npm run db:seed` only in staging, never in production with real users.

Realtime (SSE) needs a platform that allows long-lived HTTP responses, or the Redis pub/sub swap described in `docs/DEPLOYMENT.md`.

### Deploying to Vercel

The app is a standard Next.js App Router project, so Vercel only needs environment variables and a hosted database:

1. **Database:** Vercel's filesystem is ephemeral, so the local SQLite file cannot be used. Create a hosted Postgres (Neon, Supabase, Vercel Postgres) and point the schema at it:
   ```bash
   npm run db:use-postgres   # rewrites prisma/schema.prisma + .env
   ```
   You do not have to run migrations or the seed by hand — the Vercel build does both (see step 4).
2. **Uploads:** set `UPLOAD_DRIVER=cloudinary` plus `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. The local driver writes into `storage/uploads`, which is not writable/persistent on Vercel.
3. **Environment variables** (Project → Settings → Environment Variables): `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL` (the deployed URL), `EMAIL_FROM` and the email/Stripe keys you use. The full list is in `.env.example`.
4. **Build command:** `vercel.json` sets it to `npm run vercel-build`, which runs, in order:
   ```text
   prisma generate  ->  prisma migrate deploy (or prisma db push when there is no prisma/migrations)  ->  prisma/seed.ts  ->  next build
   ```
   So every deploy brings the database up to date and seeds it before the app is built. Set `SEED_ON_BUILD=false` in Vercel once the production database holds real users. `npm run build` (generate + build only) is still there for local use and CI without a database.
5. **Realtime:** SSE works on Vercel's Node runtime. Set `NEXT_RUNTIME=nodejs` behaviour by keeping the API routes on the Node runtime (they already are), and if you scale to many instances, switch the in-process bus for Redis as described in `docs/DEPLOYMENT.md`.
6. **Stripe webhook:** point it at `https://YOUR_DOMAIN/api/stripe/webhook` and copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

## Project structure

```
app/
  (site)/            public marketing, search, profiles, jobs, blog, CMS
  (auth)/            login, register, forgot/reset password, verify email
  dashboard/         family, caregiver, agency, admin + shared pages
  api/               REST route handlers
components/          ui primitives, marketing, marketplace, dashboard, forms
lib/                 auth, rbac, validators, search, email, events, storage, ...
prisma/              schema.prisma, seed.ts
scripts/             use-postgres.mjs
docs/                API.md, DEPLOYMENT.md
```
