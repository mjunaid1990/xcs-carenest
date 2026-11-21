import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared Zod schemas. These are imported by both client forms and API routes so
// the browser and server always agree on validation rules.
// ---------------------------------------------------------------------------

const password = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(128, "That password is too long.")
  .regex(/[a-zA-Z]/, "Include at least one letter.")
  .regex(/\d/, "Include at least one number.");

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address.");

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(2, "Enter your first name.").max(60),
    lastName: z.string().trim().min(2, "Enter your last name.").max(60),
    email: emailSchema,
    password,
    confirmPassword: z.string(),
    role: z.enum(["family", "caregiver", "agency"]),
    city: z.string().trim().min(2, "Enter your city.").max(80),
    state: z.string().trim().min(2, "Enter your state.").max(80),
    zip: z.string().trim().min(3, "Enter your ZIP/postal code.").max(12),
    phone: z.string().trim().max(24).optional().or(z.literal("")),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: "You must accept the Terms and Privacy Policy." }),
    }),
    agencyName: z.string().trim().max(120).optional().or(z.literal("")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.role !== "agency" || (data.agencyName?.length ?? 0) >= 2, {
    message: "Enter your agency name.",
    path: ["agencyName"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
  remember: z.boolean().optional(),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10),
    password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(80),
  email: emailSchema,
  topic: z.enum(["support", "safety", "billing", "press", "other"]),
  message: z.string().trim().min(20, "Tell us a little more (20+ characters).").max(4000),
});

// ------------------------------- Profiles ----------------------------------

export const familyProfileSchema = z.object({
  headline: z.string().trim().max(120).optional().or(z.literal("")),
  about: z.string().trim().max(2000).optional().or(z.literal("")),
  childrenCount: z.coerce.number().int().min(0).max(20),
  childrenAges: z.array(z.string().trim().max(20)).max(20).optional(),
  careNeeds: z.array(z.string().trim().max(40)).max(12).optional(),
  addressLine: z.string().trim().max(160).optional().or(z.literal("")),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  zip: z.string().trim().min(3).max(12),
  emergencyContact: z.string().trim().max(120).optional().or(z.literal("")),
});

export const availabilityEntrySchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    startMinute: z.number().int().min(0).max(1440),
    endMinute: z.number().int().min(0).max(1440),
  })
  .refine((d) => d.endMinute > d.startMinute, {
    message: "End time must be after start time.",
    path: ["endMinute"],
  });

export const caregiverProfileSchema = z.object({
  headline: z.string().trim().max(140, "Keep your headline under 140 characters.").optional().or(z.literal("")),
  bio: z.string().trim().max(3000).optional().or(z.literal("")),
  city: z.string().trim().min(2, "Enter your city.").max(80),
  state: z.string().trim().min(2, "Enter your state.").max(80),
  zip: z.string().trim().max(12).optional().or(z.literal("")),
  yearsExperience: z.coerce.number().int().min(0).max(60),
  hourlyRateCents: z.coerce.number().int().min(0).max(100000).optional().nullable(),
  rateType: z.enum(["HOURLY", "DAILY", "MONTHLY"]),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "BOTH"]),
  livingArrangement: z.enum(["LIVE_IN", "LIVE_OUT", "BOTH"]),
  minHoursPerWeek: z.coerce.number().int().min(0).max(80).optional().nullable(),
  maxHoursPerWeek: z.coerce.number().int().min(0).max(80).optional().nullable(),
  willingToTravel: z.boolean().optional(),
  travelRadiusKm: z.coerce.number().int().min(0).max(500).optional(),
  languages: z.array(z.string().trim().max(40)).max(12).optional(),
  specialNeeds: z.array(z.string().trim().max(60)).max(12).optional(),
  categories: z.array(z.string().trim().max(60)).max(12).optional(),
  skills: z.array(z.string().trim().max(60)).max(30).optional(),
  isPublished: z.boolean().optional(),
  availableForWork: z.boolean().optional(),
});

export const experienceSchema = z.object({
  employer: z.string().trim().min(2, "Enter the employer name.").max(120),
  title: z.string().trim().min(2, "Enter your job title.").max(120),
  startDate: z.string().min(4, "Enter a start date."),
  endDate: z.string().optional().or(z.literal("")),
  isCurrent: z.boolean().optional(),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const certificationSchema = z.object({
  name: z.string().trim().min(2, "Enter the certification name.").max(120),
  issuer: z.string().trim().max(120).optional().or(z.literal("")),
  issuedAt: z.string().optional().or(z.literal("")),
  expiresAt: z.string().optional().or(z.literal("")),
});

export const agencyProfileSchema = z.object({
  name: z.string().trim().min(2, "Enter the agency name.").max(120),
  about: z.string().trim().max(3000).optional().or(z.literal("")),
  website: z.string().trim().url("Enter a valid URL.").optional().or(z.literal("")),
  contactPhone: z.string().trim().max(24).optional().or(z.literal("")),
  contactEmail: emailSchema.optional().or(z.literal("")),
  licenseNumber: z.string().trim().max(60).optional().or(z.literal("")),
  addressLine: z.string().trim().max(160).optional().or(z.literal("")),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  zip: z.string().trim().min(3).max(12),
});

export const accountSettingsSchema = z.object({
  firstName: z.string().trim().min(2).max(60),
  lastName: z.string().trim().min(2).max(60),
  phone: z.string().trim().max(24).optional().or(z.literal("")),
  timezone: z.string().trim().min(2).max(60),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  state: z.string().trim().max(80).optional().or(z.literal("")),
  zip: z.string().trim().max(12).optional().or(z.literal("")),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const notificationPrefsSchema = z.object({
  emailApplications: z.boolean(),
  emailMessages: z.boolean(),
  emailInterviews: z.boolean(),
  emailBilling: z.boolean(),
  emailReviews: z.boolean(),
  emailMarketing: z.boolean(),
  inAppEnabled: z.boolean(),
});

// --------------------------------- Jobs ------------------------------------

export const jobSchema = z
  .object({
    title: z.string().trim().min(6, "Give the job a clear title.").max(140),
    categorySlug: z.string().trim().min(2, "Choose a care category."),
    description: z
      .string()
      .trim()
      .min(60, "Describe the role in at least 60 characters.")
      .max(8000),
    city: z.string().trim().min(2, "Enter the city.").max(80),
    state: z.string().trim().min(2, "Enter the state.").max(80),
    zip: z.string().trim().max(12).optional().or(z.literal("")),
    employmentType: z.enum(["FULL_TIME", "PART_TIME", "OCCASIONAL"]),
    livingArrangement: z.enum(["LIVE_IN", "LIVE_OUT"]),
    schedule: z.string().trim().min(4, "Describe the working schedule.").max(300),
    startDate: z.string().optional().or(z.literal("")),
    durationMonths: z.coerce.number().int().min(0).max(120).optional(),
    budgetType: z.enum(["HOURLY", "DAILY", "MONTHLY"]),
    budgetMin: z.coerce.number().min(0, "Enter a budget.").max(1000000),
    budgetMax: z.coerce.number().min(0).max(1000000).optional(),
    caregiversNeeded: z.coerce.number().int().min(1).max(20),
    experienceYears: z.coerce.number().int().min(0).max(40),
    requirements: z.array(z.string().trim().max(120)).max(20).optional(),
    languages: z.array(z.string().trim().max(40)).max(10).optional(),
    certifications: z.string().trim().max(300).optional().or(z.literal("")),
    status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  })
  .refine((d) => !d.budgetMax || d.budgetMax >= d.budgetMin, {
    message: "Maximum budget must be at least the minimum.",
    path: ["budgetMax"],
  });

export type JobInput = z.infer<typeof jobSchema>;

export const applicationSchema = z.object({
  message: z
    .string()
    .trim()
    .min(40, "Write at least 40 characters so the family knows why you are a fit.")
    .max(4000),
  expectedRateCents: z.coerce.number().int().min(0).max(100000).optional().nullable(),
  availableFrom: z.string().optional().or(z.literal("")),
});

export const applicationDecisionSchema = z.object({
  status: z.enum(["REVIEWING", "SHORTLISTED", "INTERVIEW", "HIRED", "REJECTED"]),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
});

// ------------------------------ Interviews ---------------------------------

export const interviewSchema = z.object({
  caregiverId: z.string().min(5),
  jobId: z.string().min(5).optional().or(z.literal("")),
  applicationId: z.string().min(5).optional().or(z.literal("")),
  type: z.enum(["ONLINE", "PHONE", "IN_PERSON"]),
  date: z.string().min(8, "Choose a date."),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Choose a time."),
  durationMinutes: z.coerce.number().int().min(15).max(180),
  timezone: z.string().trim().min(2).max(60),
  location: z.string().trim().max(200).optional().or(z.literal("")),
  meetingLink: z.string().trim().url("Enter a valid meeting link.").optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const interviewResponseSchema = z.object({
  action: z.enum(["ACCEPT", "DECLINE", "CANCEL", "COMPLETE", "RESCHEDULE"]),
  reason: z.string().trim().max(500).optional().or(z.literal("")),
  date: z.string().optional().or(z.literal("")),
  time: z.string().optional().or(z.literal("")),
});

// -------------------------------- Reviews ----------------------------------

export const reviewSchema = z.object({
  applicationId: z.string().min(5, "A completed hire is required."),
  rating: z.coerce.number().int().min(1, "Choose a rating.").max(5),
  title: z.string().trim().max(120).optional().or(z.literal("")),
  body: z
    .string()
    .trim()
    .min(30, "Share at least 30 characters about your experience.")
    .max(2000),
});

export const reviewResponseSchema = z.object({
  response: z.string().trim().min(10, "Write a short response.").max(1000),
});

// ------------------------------- Messaging ---------------------------------

export const startConversationSchema = z.object({
  recipientId: z.string().min(5),
  subject: z.string().trim().max(140).optional().or(z.literal("")),
  message: z.string().trim().min(1, "Write a message.").max(4000),
  jobId: z.string().optional().or(z.literal("")),
});

export const messageSchema = z.object({
  body: z.string().trim().min(1, "Write a message.").max(4000),
  attachmentId: z.string().optional().or(z.literal("")),
});

// ------------------------------ Trust & safety ------------------------------

export const reportSchema = z.object({
  targetType: z.enum(["USER", "JOB", "REVIEW", "MESSAGE", "CONVERSATION"]),
  targetUserId: z.string().optional().or(z.literal("")),
  targetJobId: z.string().optional().or(z.literal("")),
  targetReviewId: z.string().optional().or(z.literal("")),
  reason: z.enum([
    "safety_concern",
    "harassment",
    "fake_profile",
    "spam",
    "discrimination",
    "inappropriate_content",
    "other",
  ]),
  details: z.string().trim().min(20, "Add a few details (20+ characters).").max(2000),
});

export const verificationRequestSchema = z.object({
  type: z.enum(["IDENTITY", "BACKGROUND_CHECK", "QUALIFICATION", "AGENCY_LICENSE", "REFERENCE"]),
  documentId: z.string().optional().or(z.literal("")),
  fullLegalName: z.string().trim().max(120).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

// --------------------------------- Admin -----------------------------------

export const planSchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes."),
  name: z.string().trim().min(2).max(80),
  audience: z.enum(["FAMILY", "CAREGIVER", "AGENCY"]),
  tagline: z.string().trim().max(140).optional().or(z.literal("")),
  priceMonthlyCents: z.coerce.number().int().min(0).max(10_000_000),
  priceAnnualCents: z.coerce.number().int().min(0).max(100_000_000),
  features: z.array(z.string().trim().max(140)).max(20),
  searchLimit: z.coerce.number().int().min(0).nullable().optional(),
  applicationLimit: z.coerce.number().int().min(0).nullable().optional(),
  contactLimit: z.coerce.number().int().min(0).nullable().optional(),
  jobPostLimit: z.coerce.number().int().min(0).nullable().optional(),
  trialDays: z.coerce.number().int().min(0).max(90),
  isActive: z.boolean(),
  isPopular: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(100),
});

export const categorySchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9-]+$/),
  name: z.string().trim().min(2).max(80),
  singular: z.string().trim().min(2).max(80),
  description: z.string().trim().min(10).max(2000),
  icon: z.string().trim().max(40),
  sortOrder: z.coerce.number().int().min(0).max(100),
  isActive: z.boolean(),
  seoTitle: z.string().trim().max(160).optional().or(z.literal("")),
  seoDescription: z.string().trim().max(320).optional().or(z.literal("")),
});

export const locationSchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9-]+$/),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  stateCode: z.string().trim().min(2).max(3),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
});

export const blogPostSchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes."),
  title: z.string().trim().min(4).max(160),
  excerpt: z.string().trim().min(20).max(400),
  content: z.string().trim().min(50),
  category: z.string().trim().max(60).optional().or(z.literal("")),
  authorName: z.string().trim().min(2).max(80),
  coverImageUrl: z.string().trim().url().optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  seoTitle: z.string().trim().max(160).optional().or(z.literal("")),
  seoDescription: z.string().trim().max(320).optional().or(z.literal("")),
});

export const cmsPageSchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9-]+$/),
  title: z.string().trim().min(2).max(160),
  subtitle: z.string().trim().max(240).optional().or(z.literal("")),
  content: z.string().trim().min(20),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  seoTitle: z.string().trim().max(160).optional().or(z.literal("")),
  seoDescription: z.string().trim().max(320).optional().or(z.literal("")),
  showInFooter: z.boolean(),
});

export const settingsSchema = z.object({
  values: z.record(z.string(), z.string().max(5000)),
});

// -------------------------------- Search -----------------------------------

export const searchParamsSchema = z.object({
  type: z.string().optional(),
  q: z.string().trim().max(120).optional(),
  city: z.string().trim().max(80).optional(),
  state: z.string().trim().max(80).optional(),
  zip: z.string().trim().max(12).optional(),
  radius: z.coerce.number().min(0).max(500).optional(),
  minRate: z.coerce.number().min(0).max(10000).optional(),
  maxRate: z.coerce.number().min(0).max(10000).optional(),
  experience: z.coerce.number().min(0).max(60).optional(),
  availability: z.enum(["any", "full_time", "part_time"]).optional(),
  living: z.enum(["any", "live_in", "live_out"]).optional(),
  verified: z.enum(["any", "identity", "background"]).optional(),
  languages: z.string().optional(),
  certifications: z.string().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  sort: z.enum(["relevance", "rating", "rate_low", "rate_high", "experience", "newest"]).optional(),
  page: z.coerce.number().int().min(1).max(500).optional(),
  view: z.enum(["grid", "list", "map"]).optional(),
});
