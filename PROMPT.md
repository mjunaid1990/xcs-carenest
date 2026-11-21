# Project Brief — Complete Caregiver Marketplace ("CareNest")

Act as a senior software architect, product designer, UI/UX specialist, and full-stack developer.

Build a complete, production-ready online caregiver marketplace inspired by Care.com. The platform must connect families who need care services with qualified caregivers who are looking for employment opportunities.

IMPORTANT: This must be an original platform with its own branding, UI, layouts, components, and source code. Care.com is a functional reference only. Do not copy its logo, copyrighted content, proprietary designs, or branding.

The project must include a fully functional frontend, backend APIs, database, authentication, role-based dashboards, payment integration, messaging, job applications, caregiver search, subscriptions, and a comprehensive administration panel.

Do not build a static template or frontend-only prototype. All major buttons, forms, filters, dashboards, and workflows must work with real backend functionality.

---

## 1. Technology stack

Frontend: Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui, Lucide icons, React Hook Form, Zod, TanStack Query where appropriate.

Backend: Next.js server actions and API routes; TypeScript; REST API architecture; secure authentication and authorization.

Database: PostgreSQL + Prisma ORM.

Services: Stripe (subscriptions/payments), Cloudinary or compatible object storage (profile images, documents), Resend/SMTP email, real-time messaging (WebSockets or Supabase Realtime), Google Maps API for location search, Redis for caching and rate limiting.

All credentials via environment variables. Clean, scalable, modular architecture.

## 2. User types and permissions

**Families / Parents** — family accounts and profiles; search caregivers; view profiles; post care jobs; receive applications; shortlist; message; schedule interviews; hire; manage payments and subscriptions; submit reviews.

**Caregivers / Nannies** — accounts and professional profiles; profile pictures; work experience; qualifications and certifications; hourly/daily/monthly rates; availability; preferred locations; search jobs; apply; save jobs; message families; manage interviews; track applications; receive reviews.

**Agencies** — register as childcare agencies; agency profiles; add multiple caregivers; manage caregiver availability; publish jobs; manage applications; communicate with families; track placements and recruitment activity.

**Administrators** — manage all users, families, caregivers, agencies; verify caregiver profiles; review uploaded documents; manage job ads; handle reports and disputes; manage subscriptions and payments; configure platform fees; manage categories and locations; view analytics; configure site settings.

Strict role-based access control throughout.

## 3. Public website

Premium, modern, trustworthy marketplace. Clean and minimal, professional typography, warm welcoming colors, white backgrounds with soft neutral sections, rounded cards, subtle shadows, consistent spacing, responsive, accessible, mobile-first.

Public pages: Homepage; Find a Nanny; Find a Babysitter; Find Childcare; Find Senior Care; Find Pet Care; Find Housekeeping; Find Special Needs Care; Browse Care Jobs; How It Works; About Us; Pricing; Safety and Trust; Help Center; Contact; Blog; Blog article; Login; Registration; Forgot Password; Terms; Privacy.

Homepage: header (logo, Find Care dropdown, Find Jobs, How It Works, Pricing, Login, Join Now); hero headline "Find Trusted Care. Build Meaningful Connections." with supporting text "Connect with experienced caregivers and families looking for reliable care."; search interface (care type, location/ZIP, when care is needed, search button); popular categories; how it works; featured caregivers; latest care jobs; why families trust the platform; safety and verification; testimonials; pricing overview; FAQ; footer.

Separate search landing page per care category.

## 4. Caregiver search and discovery

Search fields: care category, city, ZIP/postal code, radius, hourly rate, availability, experience, languages, certifications, background verification status, full/part time, live-in/live-out, years of experience, special requirements.

Results: grid view, list view, sorting, pagination, map view, save caregiver, view profile, contact caregiver.

Result cards: photo, name, location, experience, hourly rate, availability, short bio, skills/qualifications, verification indicators, rating and review count, contact or view profile.

Real database-powered filtering and sorting. Never show fake search results in production.

## 5. Caregiver profile system

Each caregiver has a public professional profile: personal information (name, photo, city/location, introduction, contact preferences); professional information (years of experience, care categories, skills, qualifications, certifications, previous employment, languages, special-needs experience); employment preferences (desired rate, weekly availability, full/part time, live-in/live-out, preferred locations, minimum hours); trust information (identity verification, background-check status, references, reviews, profile completion percentage).

Actions: contact caregiver, send interview request, save profile, report profile, share profile. SEO-friendly public profile URLs such as `/caregivers/jane-smith`.

## 6. Job posting and recruitment

Job fields: title, care category, description, location, required experience, required skills, working schedule, start date, employment duration, hourly or monthly budget, number of caregivers needed, live-in/live-out, additional requirements.

Lifecycle: Draft → Published → Applications Received → Shortlisted → Interview → Hired → Completed/Closed.

Caregivers: browse/search/filter jobs; view job details; apply with a personalized message; submit profile; upload supporting documents; withdraw application; save jobs; track application status.

Families: view applicants; compare applicants; shortlist; reject; send interview requests; hire; close jobs.

Application notifications for both sides.

## 7. Dashboards

**Family**: active job posts, total applications, shortlisted caregivers, upcoming interviews, saved caregivers, recent messages. Sections: My Jobs, Applications, Saved Caregivers, Messages, Interviews, Hired Caregivers, Subscription, Payments, Reviews, Account Settings.

**Caregiver**: profile views, job applications, saved jobs, interview requests, unread messages, profile completion. Sections: My Profile, Browse Jobs, My Applications, Saved Jobs, Interviews, Messages, Availability, Reviews, Subscription, Account Settings.

**Agency**: agency profile, caregiver management, job management, candidate applications, family inquiries, placement management, billing, agency analytics.

**Admin**: total users, families, caregivers, agencies, active jobs, pending applications, new registrations, paid subscriptions, MRR, revenue reports, user growth charts, recent activity. Management: users, families, caregivers, agencies, jobs, applications, reviews, reports, verification requests, payments, subscriptions, categories, locations, CMS, email templates, platform settings.

## 8. Real-time messaging

One-to-one conversations; family↔caregiver; agency↔family; real-time delivery; read receipts; unread counters; conversation list; timestamps; image and document attachments; block user; report conversation. Only authenticated and authorized users access their conversations. Spam protection and message rate limits.

## 9. Interviews and booking

Interview date, available time slots, time-zone support, interview type (online/phone/in-person), notes, accept/decline, reschedule, cancel, email notifications, dashboard reminders. Prevent conflicting bookings where possible.

## 10. Subscriptions and monetization

Configurable plans for families, caregivers, agencies. FREE, FAMILY PREMIUM, CAREGIVER PREMIUM, AGENCY BUSINESS. All plans configurable from the admin dashboard. Stripe: checkout, monthly and annual subscriptions, renewals, cancellation, failed payment handling, webhooks, invoices, payment history. Do not hardcode prices.

## 11. Reviews and ratings

Five-star ratings, written feedback, review date, caregiver response, report review, admin moderation. Only users with an eligible completed hiring relationship can submit verified reviews. Prevent duplicate reviews and fake ratings.

## 12. Trust, safety, verification

Email verification; phone verification; identity verification architecture; background-check architecture; certification uploads; reference checks; admin verification; report user; block user; moderation; account suspension; audit logs.

Do not display a verified badge simply because a user uploaded a document. Only show verification statuses after an authorized verification process. Distinguish email verified, phone verified, identity verified, background check completed, qualifications verified. Never claim the platform guarantees a caregiver's safety.

## 13. Notifications

In-app and email notifications for: new registration, email verification, new job application, application accepted, application rejected, new message, interview invitation, interview reminder, job status change, subscription renewal, payment success, payment failure, profile verification update, new review. Users configure notification preferences.

## 14. Database design

Normalized database via Prisma. Models: User, UserRole, FamilyProfile, CaregiverProfile, AgencyProfile, CareCategory, CaregiverSkill, CaregiverCertification, CaregiverExperience, CaregiverAvailability, CareJob, JobRequirement, JobApplication, SavedCaregiver, SavedJob, Conversation, ConversationParticipant, Message, Interview, Booking, Review, VerificationRequest, Subscription, SubscriptionPlan, Payment, Invoice, Notification, Report, BlockedUser, UploadedDocument, Location, AdminAuditLog, PlatformSetting, BlogPost, CMSPage.

Primary keys, foreign keys, relationships, unique constraints, indexes, timestamps, soft deletion where appropriate. Migrations and seed scripts.

## 15. Security

Password hashing (Argon2 or bcrypt), secure sessions, role-based authorization, input validation, SQL-injection protection, XSS protection, CSRF protection, API rate limiting, secure file uploads with type/size validation, private document storage, verified payment webhooks, environment-based secrets, audit logging, account recovery, brute-force protection. Never expose private contact details or sensitive uploaded documents publicly. Privacy controls appropriate for a platform dealing with children and family information.

## 16. SEO and CMS

SEO-friendly URLs, dynamic titles, meta descriptions, canonical URLs, Open Graph metadata, XML sitemap, robots.txt, breadcrumbs, structured data, optimized images, internal linking, pagination SEO, location and category landing pages.

URL structure: `/find-nannies/`, `/find-babysitters/`, `/find-senior-care/`, `/find-pet-care/`, `/care-jobs/`, `/nanny-jobs/`, `/babysitting-jobs/`, `/caregivers/jane-smith/`, `/jobs/full-time-nanny-new-york/`, `/locations/new-york/`, `/pricing/`.

CMS for administrators to manage pages, blog posts, FAQs, testimonials, homepage sections, SEO metadata. Avoid thousands of low-quality location pages.

## 17. Responsive design

Desktop, laptop, tablet and mobile. Responsive navigation, mobile dashboard navigation, optimized search filters, touch-friendly buttons, responsive cards, mobile messaging, easy job application forms. Prioritize smartphone experience.

## 18. Design system

Reusable components: Header, Footer, Navigation, Search bar, Search filters, Caregiver card, Job card, Profile header, Rating, Verification badge, Pricing card, Dashboard sidebar, Dashboard statistics, Data tables, Pagination, Modal, Dropdown, Form components, Toast notifications, Loading skeletons, Empty states, Error states. Consistent typography, spacing, colors, borders, breakpoints. Polished professional interface, not a generic admin template.

## 19. Delivery phases

1. Architecture: project architecture, Next.js, TypeScript, Tailwind, shadcn/ui, Prisma, schema, migrations.
2. Authentication: register, login, logout, password recovery, email verification, RBAC.
3. Public website: homepage, category pages, search pages, pricing, content pages.
4. Marketplace: profiles, discovery, filters, job posting, applications, saved items.
5. Dashboards: family, caregiver, agency, admin.
6. Communication: messaging, notifications, interview scheduling.
7. Monetization: plans, Stripe checkout, webhooks, billing.
8. Trust and safety: verification workflows, reporting, moderation, reviews.
9. SEO and CMS: technical SEO, blog, CMS, location pages.
10. Testing and deployment: unit, integration, e2e, security, performance tests; production deployment documentation.

## 20. Code quality

TypeScript throughout; avoid unnecessary `any`; clean architecture; reusable components; business logic separated from UI; proper error handling; server-side validation; loading and empty states; no duplicated code; no hardcoded sample data in production components; database records for dynamic content; meaningful comments for complex logic; maintainable and scalable code.

Deliver: README.md, .env.example, Prisma schema, migrations, seed scripts, API documentation, deployment instructions.

## 21. Acceptance criteria

1. Users can register and log in.
2. Each user receives the correct dashboard.
3. Caregivers can create and manage professional profiles.
4. Families can search and filter caregivers.
5. Families can publish jobs.
6. Caregivers can apply for jobs.
7. Families can shortlist and hire applicants.
8. Users can communicate through messaging.
9. Interviews can be scheduled.
10. Reviews can be submitted according to eligibility rules.
11. Subscriptions can be purchased and managed.
12. Administrators can manage the entire platform.
13. Search and filters return actual database results.
14. All forms have validation and error handling.
15. All major actions work on desktop and mobile.
16. Security and authorization are enforced on the backend.
17. The application can be deployed to production.

If a third-party API requires credentials, implement the integration structure and provide clear environment variable instructions. Never pretend an external integration is functional without valid credentials.
