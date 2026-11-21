# CareNest API reference

All endpoints live under `/api`. JSON in, JSON out, except uploads (multipart) and the SSE stream.

## Conventions

**Auth** — session cookie (`carenest_session`), HttpOnly, SameSite=Lax. `GET /api/auth/session` returns the current user or `null`. Protected endpoints return `401 UNAUTHENTICATED` when signed out and `403 FORBIDDEN` when the role is wrong.

**CSRF** — every `POST`, `PATCH`, `PUT`, `DELETE` requires a same-origin request (`Origin`/`Referer` must match `NEXT_PUBLIC_APP_URL` or the request host). Mismatches return `403`.

**Response envelope**

```json
{ "ok": true, "data": { ... } }
{ "ok": false, "error": { "code": "VALIDATION_ERROR", "message": "…", "fields": { "email": "Invalid email" } } }
```

**Status codes** — 200 OK, 201 Created, 400 bad input, 401 unauthenticated, 403 forbidden, 404 not found, 409 conflict, 422 validation, 429 rate limited (`Retry-After` set), 500 server error.

**Rate limits** — login, register, password reset, messages, applications, reports, uploads and contact are limited per IP (and per user where signed in). Defaults are configurable in `lib/rate-limit.ts` and the `messaging.ratePerMinute` platform setting.

**Money** — all amounts are integer cents (`priceMonthlyCents`, `amountCents`). Format on the client.

---

## Auth

| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | `{ role, firstName, lastName, email, password, city, state, zip, acceptTerms }` | Creates user + role profile, sends verification email, starts a session. `409` if email exists. |
| POST | `/api/auth/login` | `{ email, password }` | `429` after repeated failures. `403` if suspended or unverified where required. |
| POST | `/api/auth/logout` | – | Revokes the session and clears the cookie. |
| GET | `/api/auth/session` | – | `{ user }` or `{ user: null }`. |
| POST | `/api/auth/forgot-password` | `{ email }` | Always `200` (no account enumeration). |
| POST | `/api/auth/reset-password` | `{ token, password }` | Single-use, expiring token. |
| POST | `/api/auth/resend-verification` | – | Signed in; re-sends the verification email. |

## Account and profiles

| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| PATCH | `/api/account` | `{ firstName, lastName, phone, timezone, city, state, zip, prefs }` | `prefs` holds notification booleans. |
| POST | `/api/account/password` | `{ currentPassword, newPassword }` | Revokes other sessions. |
| PATCH | `/api/profile` | role-dependent profile fields (`headline`, `about`, `rateCents`, `experienceYears`, skills, availability, `agency.name`, …) | Upserts the profile for the signed-in role. Caregiver-only fields are rejected for other roles. |

## Search, caregivers, saved

Search and profile browsing are rendered server-side from Prisma; there is no public JSON search endpoint (this keeps one source of truth). Saved items use a toggle API.

| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| POST | `/api/saved` | `{ kind: "caregiver" \| "job", id }` | Toggles; returns `{ saved: boolean }`. |
| POST | `/api/saved/caregivers` | `{ id }` | Convenience alias used by the save button. |
| POST | `/api/saved/jobs` | `{ id }` | Convenience alias. |

## Jobs and applications

| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| POST | `/api/jobs` | `{ title, categoryId, description, city, state, zip, schedule, payMinCents, payMaxCents, payPeriod, startDate, childrenCount, requirements, benefits, status }` | Family or agency only. Enforces `jobPostLimit` for the role's plan. |
| PATCH | `/api/jobs/[id]` | any subset of the create fields, or `{ status }` (`DRAFT`, `PUBLISHED`, `PAUSED`, `CLOSED`) | Owner or agency member only. |
| DELETE | `/api/jobs/[id]` | – | Soft delete (sets `deletedAt`), closes applications. |
| POST | `/api/jobs/[slug]/apply` | `{ message, availability, expectedRateCents }` | Caregiver only; unique per job; `409` if already applied. Enforces `applicationLimit`. |
| PATCH | `/api/applications/[id]` | `{ action: "shortlist" \| "interview" \| "hire" \| "reject" \| "withdraw" \| "review", note? }` | Families act on their own jobs; caregivers may only withdraw. `hire` timestamps the hire and closes the job. |

## Interviews

| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| POST | `/api/interviews` | `{ applicationId, scheduledFor, durationMinutes, mode, location, notes }` | Family or agency for their job. |
| PATCH | `/api/interviews/[id]` | `{ action: "accept" \| "decline" \| "reschedule" \| "complete", scheduledFor?, note? }` | Either participant. |

## Messaging and realtime

| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| GET | `/api/conversations` | – | Conversations with participants, last message, unread count. |
| POST | `/api/conversations` | `{ participantId, jobId?, subject?, message? }` | Creates or returns the existing 1:1 thread. |
| GET | `/api/conversations/[id]/messages` | `?before=<messageId>` | Paged history, oldest-last. |
| POST | `/api/conversations/[id]/messages` | `{ body }` | Persists, emits realtime event, notifies the other participant(s). |
| POST | `/api/conversations/[id]/read` | `{ messageId? }` | Marks messages read up to `messageId` (or all). |
| GET | `/api/stream` | – | `text/event-stream`. Events: `message`, `read`, `notification`, `heartbeat`. |

## Reviews, reports, verification

| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| POST | `/api/reviews` | `{ applicationId, rating, title?, body }` | Family only, application must be `HIRED`, one review per hire. Recalculates the caregiver's rating. |
| POST | `/api/reports` | `{ targetType, targetUserId?, targetJobId?, targetReviewId?, reason, details }` | Any signed in user; rate limited. |
| GET | `/api/verification` | – | The caller's requests with status. |
| POST | `/api/verification` | `{ type, documentId?, fullLegalName?, notes? }` | `type`: `IDENTITY`, `BACKGROUND_CHECK`, `QUALIFICATION`, `REFERENCE`, `AGENCY_LICENSE`. Rejects duplicate pending requests of the same type. |

## Uploads and files

| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| POST | `/api/uploads` | `multipart/form-data`: `file`, `kind` | Max 5 MB; PDF, PNG, JPEG, WebP; private by default. Returns `{ id, url, fileName, size }`. |
| GET | `/api/files/[id]` | – | Streams the file to its owner or an admin. Documents are never public. |

## Notifications

| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| GET | `/api/notifications` | `?unread=true` | List + unread count. |
| PATCH | `/api/notifications` | `{ ids?: string[], all?: boolean, read?: boolean }` | Mark read/unread. |

## Billing

| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| POST | `/api/subscription/checkout` | `{ planId, interval: "MONTHLY" \| "ANNUAL" }` | Returns `{ url }` (Stripe Checkout) or creates a labelled sandbox subscription and returns `{ sandbox: true }`. |
| POST | `/api/subscription/cancel` | `{ atPeriodEnd?: boolean }` | Cancels the caller's subscription. |
| POST | `/api/stripe/webhook` | raw Stripe event | Signature verified; updates subscription, payment and invoice rows. Requires `STRIPE_WEBHOOK_SECRET`. |

## Admin

| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| PATCH | `/api/admin/moderation` | `{ type, id, action, note?, status? }` | `type`: `user` (`suspend`, `reactivate`), `verification` (`approve`, `reject`, `info`), `report` (`review`, `resolve`, `dismiss`), `review` (`publish`, `hide`, `remove`), `job` (`publish`, `pause`, `close`). Every call is audited. |
| POST/PATCH/DELETE | `/api/admin/content` | `{ resource, id?, data }` | `resource`: `plans`, `categories`, `locations`, `cms`, `blog`, `settings`. `DELETE` archives/soft-disables. Settings accept `{ values: Record<string,string> }`. |

## Public

| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| POST | `/api/contact` | `{ name, email, topic, message }` | Rate limited; stores a message and notifies support. |

## Examples

```bash
# Sign in

```bash
# Sign in (cookie saved for later calls)
curl -i -c cookies.txt -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d '{"email":"sarah@carenest.dev","password":"Password123!"}' \
  http://localhost:3000/api/auth/login

# Post a job
curl -b cookies.txt -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d '{"title":"After-school nanny","categoryId":"...","description":"...","city":"Austin","state":"TX","zip":"78704","schedule":"PART_TIME","payMinCents":2200,"payMaxCents":2800,"payPeriod":"HOUR","status":"PUBLISHED"}' \
  http://localhost:3000/api/jobs

# Stream realtime events
curl -b cookies.txt -N http://localhost:3000/api/stream
```
