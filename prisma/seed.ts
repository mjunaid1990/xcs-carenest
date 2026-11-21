import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const prisma = new PrismaClient();
const PASSWORD = "Password123!";

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000);
const daysFromNow = (days: number) => new Date(Date.now() + days * 86_400_000);

// ------------------------------- Taxonomy ----------------------------------

const CATEGORIES = [
  {
    slug: "nanny",
    name: "Nannies",
    singular: "Nanny",
    shortName: "Nanny",
    icon: "Heart",
    sortOrder: 1,
    description:
      "Full-time and part-time nannies who provide consistent, in-home care for your children.",
    longDescription:
      "A nanny becomes part of your family's daily rhythm. CareNest nannies offer reliable childcare in your home, from school runs and homework help to meals, routines and bedtime. Compare experience, availability and rates, then interview candidates directly.",
  },
  {
    slug: "babysitter",
    name: "Babysitters",
    singular: "Babysitter",
    shortName: "Babysitter",
    icon: "Baby",
    sortOrder: 2,
    description: "Trusted babysitters for date nights, appointments and occasional cover.",
    longDescription:
      "Sometimes you need a few hours of dependable care. Babysitters on CareNest set their own availability and rates, so you can book occasional, evening or weekend cover with someone nearby.",
  },
  {
    slug: "childcare",
    name: "Childcare",
    singular: "Childcare provider",
    shortName: "Childcare",
    icon: "Users",
    sortOrder: 3,
    description:
      "Childcare providers for families who need flexible, structured care during the working week.",
    longDescription:
      "Find childcare providers for before- and after-school care, shared care arrangements and part-time schedules. Filter by experience, certifications and availability to match your family's week.",
  },
  {
    slug: "senior-care",
    name: "Senior Care",
    singular: "Senior caregiver",
    shortName: "Senior care",
    icon: "HeartHandshake",
    sortOrder: 4,
    description:
      "Compassionate support for older adults, from companionship to personal care and dementia support.",
    longDescription:
      "Senior caregivers help with companionship, meals, mobility, medication reminders and daily routines. Review experience with dementia, mobility support and personal care before you interview.",
  },
  {
    slug: "pet-care",
    name: "Pet Care",
    singular: "Pet sitter",
    shortName: "Pet care",
    icon: "PawPrint",
    sortOrder: 5,
    description: "Pet sitters and dog walkers who keep your animals happy while you are away.",
    longDescription:
      "Find pet sitters for overnight stays, daily walks and drop-in visits. Caregivers list the animals they are comfortable with and the areas they cover.",
  },
  {
    slug: "housekeeping",
    name: "Housekeeping",
    singular: "Housekeeper",
    shortName: "Housekeeping",
    icon: "Sparkles",
    sortOrder: 6,
    description: "Reliable housekeepers for recurring cleaning, laundry and home organisation.",
    longDescription:
      "Housekeepers on CareNest offer weekly, fortnightly and one-off cleaning. Compare rates, services and availability, and agree the scope directly with the person you hire.",
  },
  {
    slug: "special-needs",
    name: "Special Needs Care",
    singular: "Special needs caregiver",
    shortName: "Special needs",
    icon: "Accessibility",
    sortOrder: 7,
    description:
      "Experienced caregivers for children and adults with additional support needs.",
    longDescription:
      "Special needs caregivers bring training and lived experience to autism, ADHD, sensory needs, physical disabilities and complex medical routines. Filter by certifications and specific experience.",
  },
];

const LOCATIONS = [
  ["new-york", "New York", "New York", "NY", 40.7128, -74.006],
  ["boston", "Boston", "Massachusetts", "MA", 42.3601, -71.0589],
  ["seattle", "Seattle", "Washington", "WA", 47.6062, -122.3321],
  ["chicago", "Chicago", "Illinois", "IL", 41.8781, -87.6298],
  ["austin", "Austin", "Texas", "TX", 30.2672, -97.7431],
  ["denver", "Denver", "Colorado", "CO", 39.7392, -104.9903],
  ["san-francisco", "San Francisco", "California", "CA", 37.7749, -122.4194],
  ["atlanta", "Atlanta", "Georgia", "GA", 33.749, -84.388],
];

// ------------------------------- Caregivers --------------------------------

type SeedCaregiver = {
  first: string;
  last: string;
  slug: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  headline: string;
  bio: string;
  years: number;
  rate: number;
  rateType?: string;
  employment: string;
  living: string;
  languages: string[];
  specialNeeds: string[];
  skills: string[];
  categories: string[];
  experience: { employer: string; title: string; years: number }[];
  certifications: { name: string; issuer: string; verified?: boolean }[];
  identityVerified: boolean;
  backgroundChecked: boolean;
  qualificationsVerified: boolean;
  published: boolean;
  featured?: boolean;
  rating: number;
  ratingCount: number;
  agency?: boolean;
};

const CAREGIVERS: SeedCaregiver[] = [
  {
    first: "Amelia",
    last: "Hart",
    slug: "amelia-hart",
    city: "Boston",
    state: "Massachusetts",
    zip: "02118",
    lat: 42.3439,
    lng: -71.0706,
    headline: "Warm, organised nanny with 9 years of infant and toddler experience",
    bio:
      "I have spent nine years caring for children from newborn to age six, with a focus on gentle routines, outdoor play and early literacy. I plan activities around each child's stage, keep a daily log for parents and am comfortable with meal prep, naps and school runs. Families describe me as calm, dependable and endlessly patient.",
    years: 9,
    rate: 2800,
    employment: "FULL_TIME",
    living: "LIVE_OUT",
    languages: ["English", "Spanish"],
    specialNeeds: ["Autism awareness", "Sensory processing"],
    skills: ["Infant care", "Toddler routines", "Meal preparation", "Early literacy", "School pickup"],
    categories: ["nanny", "babysitter", "childcare"],
    experience: [
      { employer: "The Alvarez family", title: "Full-time nanny", years: 4 },
      { employer: "Back Bay Daycare", title: "Lead toddler teacher", years: 3 },
    ],
    certifications: [
      { name: "Pediatric CPR & First Aid", issuer: "American Red Cross", verified: true },
      { name: "Early Childhood Education Certificate", issuer: "Boston College", verified: true },
    ],
    identityVerified: true,
    backgroundChecked: true,
    qualificationsVerified: true,
    published: true,
    featured: true,
    rating: 4.9,
    ratingCount: 18,
  },
  {
    first: "Daniel",
    last: "Okafor",
    slug: "daniel-okafor",
    city: "Seattle",
    state: "Washington",
    zip: "98103",
    lat: 47.6733,
    lng: -122.3425,
    headline: "Patient childcare provider and after-school tutor",
    bio:
      "I care for school-age children and love turning homework into something kids actually enjoy. I have five years of experience in after-school programs and family homes, and I am comfortable supporting children with ADHD. Reliable transport, non-smoker, and happy to help with light housekeeping.",
    years: 5,
    rate: 2400,
    employment: "BOTH",
    living: "LIVE_OUT",
    languages: ["English", "Yoruba"],
    specialNeeds: ["ADHD support", "Dyslexia support"],
    skills: ["Homework help", "After-school care", "Cooking", "Sports activities"],
    categories: ["childcare", "babysitter", "special-needs"],
    experience: [{ employer: "Fremont After-School Club", title: "Programme assistant", years: 5 }],
    certifications: [{ name: "First Aid & CPR", issuer: "Red Cross" }],
    identityVerified: true,
    backgroundChecked: true,
    qualificationsVerified: false,
    published: true,
    featured: true,
    rating: 4.7,
    ratingCount: 11,
  },
  {
    first: "Priya",
    last: "Raman",
    slug: "priya-raman",
    city: "New York",
    state: "New York",
    zip: "10003",
    lat: 40.7316,
    lng: -73.9885,
    headline: "Special needs caregiver with paediatric nursing background",
    bio:
      "I am a former paediatric nurse with twelve years of experience supporting children with complex needs, including tube feeding, seizure management and developmental therapy routines. I work closely with parents and therapists so that care at home matches the plan at school or clinic.",
    years: 12,
    rate: 4200,
    employment: "FULL_TIME",
    living: "LIVE_OUT",
    languages: ["English", "Tamil", "Hindi"],
    specialNeeds: ["Complex medical needs", "Autism", "Cerebral palsy", "Seizure management"],
    skills: ["Medication management", "Tube feeding", "Therapy support", "Personal care"],
    categories: ["special-needs", "senior-care", "childcare"],
    experience: [
      { employer: "NYU Langone Pediatrics", title: "Paediatric nurse", years: 7 },
      { employer: "Private family", title: "Special needs caregiver", years: 5 },
    ],
    certifications: [
      { name: "Registered Nurse (RN)", issuer: "New York State", verified: true },
      { name: "Paediatric CPR", issuer: "AHA", verified: true },
    ],
    identityVerified: true,
    backgroundChecked: true,
    qualificationsVerified: true,
    published: true,
    featured: true,
    rating: 5,
    ratingCount: 9,
  },
  {
    first: "Grace",
    last: "Lindqvist",
    slug: "grace-lindqvist",
    city: "Chicago",
    state: "Illinois",
    zip: "60614",
    lat: 41.9211,
    lng: -87.6478,
    headline: "Senior companion and dementia support specialist",
    bio:
      "For the past eight years I have supported older adults who want to remain independent at home. My focus is companionship, gentle routine, mobility support, and dementia care that protects dignity. I cook, drive to appointments and keep families updated with a weekly note.",
    years: 8,
    rate: 2600,
    employment: "PART_TIME",
    living: "LIVE_OUT",
    languages: ["English", "Swedish"],
    specialNeeds: ["Dementia", "Mobility support", "Parkinson's"],
    skills: ["Companionship", "Dementia care", "Meal preparation", "Transport to appointments"],
    categories: ["senior-care"],
    experience: [{ employer: "Lakeview Senior Living", title: "Care assistant", years: 8 }],
    certifications: [
      { name: "Certified Nursing Assistant", issuer: "Illinois", verified: true },
      { name: "Dementia Care Certificate", issuer: "Alzheimer's Association", verified: true },
    ],
    identityVerified: true,
    backgroundChecked: true,
    qualificationsVerified: true,
    published: true,
    rating: 4.8,
    ratingCount: 14,
  },
  {
    first: "Tomás",
    last: "Ferreira",
    slug: "tomas-ferreira",
    city: "Austin",
    state: "Texas",
    zip: "78704",
    lat: 30.2427,
    lng: -97.7666,
    headline: "Dog walker and overnight pet sitter who loves big dogs",
    bio:
      "I have looked after dogs, cats, rabbits and the occasional parrot for six years. I offer daily walks, drop-in visits and overnight stays, and I send photo updates after every visit. Comfortable with large breeds and animals on medication.",
    years: 6,
    rate: 1800,
    employment: "BOTH",
    living: "LIVE_OUT",
    languages: ["English", "Portuguese"],
    specialNeeds: ["Anxious pets", "Medication routines"],
    skills: ["Dog walking", "Overnight stays", "Pet medication", "Cat care"],
    categories: ["pet-care", "housekeeping"],
    experience: [{ employer: "South Congress Pet Care", title: "Pet sitter", years: 6 }],
    certifications: [{ name: "Pet First Aid", issuer: "Pet Sitters International" }],
    identityVerified: false,
    backgroundChecked: false,
    qualificationsVerified: false,
    published: true,
    rating: 4.6,
    ratingCount: 7,
  },
  {
    first: "Nadia",
    last: "Haddad",
    slug: "nadia-haddad",
    city: "Denver",
    state: "Colorado",
    zip: "80206",
    lat: 39.7289,
    lng: -104.9537,
    headline: "Detail-focused housekeeper for busy households",
    bio:
      "I have cleaned private homes for seven years and take real pride in the details — the corners, the fridge shelves, the laundry that actually gets put away. I bring my own eco-friendly supplies, work around pets and children, and can do weekly or fortnightly visits.",
    years: 7,
    rate: 2200,
    employment: "BOTH",
    living: "LIVE_OUT",
    languages: ["English", "Arabic", "French"],
    specialNeeds: ["Eco-friendly products", "Pet-friendly"],
    skills: ["Deep cleaning", "Laundry", "Organisation", "Eco-friendly cleaning"],
    categories: ["housekeeping"],
    experience: [{ employer: "Private households", title: "Housekeeper", years: 7 }],
    certifications: [],
    identityVerified: true,
    backgroundChecked: false,
    qualificationsVerified: false,
    published: true,
    rating: 4.5,
    ratingCount: 6,
  },
  {
    first: "Marcus",
    last: "Bell",
    slug: "marcus-bell",
    city: "San Francisco",
    state: "California",
    zip: "94110",
    lat: 37.7485,
    lng: -122.4181,
    headline: "Live-in nanny and household manager for busy professionals",
    bio:
      "I have worked as a live-in nanny and household manager for two professional families in the Bay Area. I handle the school run, activities, homework, cooking and the household calendar, and I am comfortable travelling with families. Ten years of experience, clean driving record.",
    years: 10,
    rate: 3200,
    employment: "FULL_TIME",
    living: "LIVE_IN",
    languages: ["English", "French"],
    specialNeeds: ["Twins", "Travel with family"],
    skills: ["Live-in care", "Household management", "Cooking", "Driving", "Travel"],
    categories: ["nanny", "childcare", "housekeeping"],
    experience: [{ employer: "Private family, Pacific Heights", title: "Live-in nanny", years: 6 }],
    certifications: [
      { name: "CPR & First Aid", issuer: "Red Cross", verified: true },
      { name: "Clean driving record", issuer: "DMV" },
    ],
    identityVerified: true,
    backgroundChecked: true,
    qualificationsVerified: false,
    published: true,
    rating: 4.8,
    ratingCount: 12,
  },
  {
    first: "Sofia",
    last: "Marino",
    slug: "sofia-marino",
    city: "New York",
    state: "New York",
    zip: "11215",
    lat: 40.6695,
    lng: -73.9822,
    headline: "Babysitter available evenings and weekends in Brooklyn",
    bio:
      "I am a graduate student in early childhood education and babysit evenings and weekends. I am great with babies and toddlers, comfortable with bedtime routines, and can help with light tidying after the children are asleep.",
    years: 4,
    rate: 2000,
    employment: "PART_TIME",
    living: "LIVE_OUT",
    languages: ["English", "Italian"],
    specialNeeds: ["Infant care"],
    skills: ["Bedtime routines", "Infant care", "Arts and crafts"],
    categories: ["babysitter", "nanny"],
    experience: [{ employer: "Park Slope families", title: "Regular babysitter", years: 4 }],
    certifications: [{ name: "CPR & First Aid", issuer: "Red Cross" }],
    identityVerified: false,
    backgroundChecked: false,
    qualificationsVerified: false,
    published: true,
    rating: 4.4,
    ratingCount: 5,
  },
  {
    first: "Kwame",
    last: "Asante",
    slug: "kwame-asante",
    city: "Atlanta",
    state: "Georgia",
    zip: "30312",
    lat: 33.7465,
    lng: -84.3733,
    headline: "Senior caregiver and certified home health aide",
    bio:
      "I am a certified home health aide with six years of experience supporting older adults with mobility, personal care and medication reminders. I am patient, punctual and I treat every client the way I would want my own parents treated.",
    years: 6,
    rate: 2300,
    employment: "FULL_TIME",
    living: "LIVE_OUT",
    languages: ["English", "Twi"],
    specialNeeds: ["Stroke recovery", "Diabetes support"],
    skills: ["Personal care", "Medication reminders", "Mobility assistance", "Meal preparation"],
    categories: ["senior-care", "special-needs"],
    experience: [{ employer: "Peachtree Home Health", title: "Home health aide", years: 6 }],
    certifications: [
      { name: "Home Health Aide Certification", issuer: "Georgia", verified: true },
    ],
    identityVerified: true,
    backgroundChecked: true,
    qualificationsVerified: true,
    published: true,
    rating: 4.7,
    ratingCount: 8,
  },
  {
    first: "Elena",
    last: "Petrov",
    slug: "elena-petrov",
    city: "Seattle",
    state: "Washington",
    zip: "98115",
    lat: 47.6821,
    lng: -122.2934,
    headline: "Early years specialist for twins and multiples",
    bio:
      "Twins are my speciality. I have eight years of experience with multiples and high-needs infants, including sleep training, feeding schedules and developmental play. I work with parents to build a routine that the whole household can keep.",
    years: 8,
    rate: 3000,
    employment: "FULL_TIME",
    living: "BOTH",
    languages: ["English", "Russian"],
    specialNeeds: ["Twins", "Premature infants", "Postpartum support"],
    skills: ["Multiples care", "Sleep training", "Feeding schedules", "Development"],
    categories: ["nanny", "childcare"],
    experience: [{ employer: "Private family", title: "Nanny for twins", years: 5 }],
    certifications: [
      { name: "Newborn Care Specialist", issuer: "NBDA", verified: true },
      { name: "CPR & First Aid", issuer: "Red Cross", verified: true },
    ],
    identityVerified: true,
    backgroundChecked: true,
    qualificationsVerified: true,
    published: true,
    featured: true,
    rating: 4.9,
    ratingCount: 16,
  },
  {
    first: "Jordan",
    last: "Reyes",
    slug: "jordan-reyes",
    city: "Austin",
    state: "Texas",
    zip: "78745",
    lat: 30.2224,
    lng: -97.8005,
    headline: "Afternoon babysitter and activity leader",
    bio:
      "I run the after-school programme at a community centre and babysit in the afternoons and evenings. I am energetic, safety-focused and always have a game or a craft ready.",
    years: 3,
    rate: 1700,
    employment: "PART_TIME",
    living: "LIVE_OUT",
    languages: ["English", "Spanish"],
    specialNeeds: [],
    skills: ["Games and activities", "Homework help", "Cooking"],
    categories: ["babysitter", "childcare"],
    experience: [{ employer: "East Austin Community Centre", title: "Activity leader", years: 3 }],
    certifications: [{ name: "First Aid", issuer: "Red Cross" }],
    identityVerified: false,
    backgroundChecked: false,
    qualificationsVerified: false,
    published: true,
    rating: 4.3,
    ratingCount: 4,
  },
  {
    first: "Hannah",
    last: "Kim",
    slug: "hannah-kim",
    city: "Boston",
    state: "Massachusetts",
    zip: "02116",
    lat: 42.3505,
    lng: -71.0749,
    headline: "Nest & Nurture senior nanny — newborn and toddler care",
    bio:
      "I am a senior nanny with Nest & Nurture Agency, placing with families who need consistent, long-term care. Fourteen years of experience, with a focus on the first three years and gentle sleep routines.",
    years: 14,
    rate: 3400,
    employment: "FULL_TIME",
    living: "LIVE_OUT",
    languages: ["English", "Korean"],
    specialNeeds: ["Newborn care", "Postpartum support"],
    skills: ["Newborn care", "Sleep routines", "Toddler development", "Cooking"],
    categories: ["nanny", "childcare"],
    experience: [{ employer: "Nest & Nurture Agency", title: "Senior nanny", years: 6 }],
    certifications: [
      { name: "Newborn Care Specialist", issuer: "NBDA", verified: true },
      { name: "CPR & First Aid", issuer: "Red Cross", verified: true },
    ],
    identityVerified: true,
    backgroundChecked: true,
    qualificationsVerified: true,
    published: true,
    rating: 5,
    ratingCount: 21,
    agency: true,
  },
];

// -------------------------------- Content ----------------------------------

const FAQS = [
  {
    question: "How does CareNest verify caregivers?",
    answer:
      "We verify email addresses for every account. Caregivers can optionally submit identity documents, references and certifications for review by our trust & safety team. A badge only appears once a check has actually been completed — never simply because a document was uploaded.",
    category: "trust",
  },
  {
    question: "Is CareNest free to use?",
    answer:
      "You can create an account, build a profile and browse for free. Families on the free plan can publish one job and review applicants. Premium plans unlock unlimited search filters, contact and messaging limits, and profile analytics. Prices are always shown on the pricing page.",
    category: "billing",
  },
  {
    question: "How do families and caregivers communicate?",
    answer:
      "Once either side starts a conversation, you can message in real time inside CareNest. You can share photos and documents, and every conversation shows read receipts. To protect privacy, personal contact details stay inside the platform until you choose to share them.",
    category: "messaging",
  },
  {
    question: "How do interviews work?",
    answer:
      "A family can invite a caregiver to an online, phone or in-person interview directly from an application or a profile. The caregiver accepts, declines or asks to reschedule. Both sides see upcoming interviews in their dashboard and receive email reminders.",
    category: "interviews",
  },
  {
    question: "When can I leave a review?",
    answer:
      "Reviews are verified: you can review a caregiver only after a job application from that caregiver has been marked as hired. This keeps ratings honest and prevents duplicate or fake reviews. Caregivers can respond once to any review.",
    category: "reviews",
  },
  {
    question: "What should I check before hiring?",
    answer:
      "Always interview in person or by video, ask for references, confirm certifications directly with the issuing body and start with a trial period. CareNest supports these steps but does not guarantee any caregiver's safety, so your own diligence matters.",
    category: "trust",
  },
  {
    question: "Can agencies manage several caregivers?",
    answer:
      "Yes. Agency accounts can add caregivers to their roster, manage availability, publish jobs on behalf of the agency, track applications and placements, and review agency-level analytics on the Business plan.",
    category: "agencies",
  },
  {
    question: "How do cancellations work?",
    answer:
      "You can cancel a subscription at any time from your billing page. It stays active until the end of the current period, then reverts to the free plan. Existing jobs, messages and reviews are never deleted.",
    category: "billing",
  },
];

const TESTIMONIALS = [
  {
    authorName: "Rachel M.",
    authorRole: "Parent of two, Boston",
    quote:
      "We found our nanny in eleven days. Being able to read real reviews from families who had actually hired her made the decision so much easier.",
    rating: 5,
  },
  {
    authorName: "Diego S.",
    authorRole: "Family, Austin",
    quote:
      "The interview scheduling alone saved me hours of back-and-forth. Everything stayed in one place, and the reminders were a lifesaver.",
    rating: 5,
  },
  {
    authorName: "Amelia H.",
    authorRole: "Nanny, Boston",
    quote:
      "As a caregiver I finally have a profile that shows my certifications and experience properly. I get approached by families who are genuinely a fit.",
    rating: 5,
  },
  {
    authorName: "Nest & Nurture Agency",
    authorRole: "Agency partner",
    quote:
      "Managing a roster of nannies used to mean spreadsheets. Now placements, availability and family enquiries live in one dashboard.",
    rating: 4,
  },
];

const BLOG_POSTS = [
  {
    slug: "questions-to-ask-a-nanny-reference",
    title: "12 questions worth asking a nanny's references",
    excerpt:
      "A reference call is your best chance to hear what a previous family really experienced. Here is a practical script.",
    category: "Hiring",
    content: `## Why references still matter

Certificates and interviews tell you what a caregiver knows. References tell you how they behaved on a normal Tuesday.

### Before you call

- Confirm the relationship and dates with the caregiver first.
- Ask whether the reference is comfortable speaking for ten minutes.
- Have the job description in front of you.

## The questions

1. How long did the caregiver work with your family, and why did the arrangement end?
2. What routines did they own day to day?
3. How did they handle a toddler meltdown or a difficult bedtime?
4. How did they communicate with you during the day?
5. Were they punctual? How often did they call in sick?
6. What did your children love about them?
7. What did they do when a child was ill?
8. How comfortable were they with screen-time rules and discipline?
9. How did they handle emergencies or first aid?
10. Did they help with cooking, laundry or school runs?
11. What would you change about how you worked together?
12. Would you hire them again?

## What to listen for

Specific stories beat adjectives. "She was great" is a weaker signal than "when our son had croup she stayed calm, called the paediatrician and kept a log of his temperature".`,
  },
  {
    slug: "how-much-do-nannies-cost",
    title: "What nannies actually cost in 2026 (and what changes the number)",
    excerpt:
      "Rates vary more than most families expect. Here is how to budget without guessing.",
    category: "Budgeting",
    content: `## Rates are a range, not a number

Every caregiver sets their own hourly, daily or monthly rate on CareNest. What you pay depends on location, experience, certifications, hours and whether the role is live-in.

## The factors that move the rate

- **Experience**: caregivers with 8+ years and specialist training command more.
- **Scope**: cooking, laundry and driving usually add to the base rate.
- **Hours**: full-time roles usually have a lower effective hourly rate than occasional babysitting.
- **Live-in**: accommodation is part of the package, which changes the cash rate.

## Budgeting beyond the hourly rate

Remember payroll taxes, insurance and any trial-period overlap. A useful rule is to plan a 15–20% buffer on top of the caregiver's rate.

## How to compare offers fairly

Compare the total weekly cost, not the hourly rate alone. A caregiver at a higher rate who includes meal prep may be cheaper than a lower rate plus a separate cleaner.`,
  },
  {
    slug: "first-week-with-a-new-caregiver",
    title: "A calm first week with a new caregiver",
    excerpt:
      "The handover week sets the tone for months. Use a simple plan so everyone knows what to expect.",
    category: "Family life",
    content: `## Day one: shadow, don't disappear

Stay nearby for the first few hours. Introduce routines with the caregiver present, then step back gradually.

## Write it down

A one-page household guide beats a long conversation. Include:

- Nap and meal times
- Allergies and medical notes
- Emergency contacts
- Wi-Fi details, alarm codes and where things live
- Screen-time and discipline rules

## Check in at the end of each day

Ten minutes at handover prevents most misunderstandings. Ask what went well and what was hard, and keep notes for the next day.

## Give it two weeks

Most families need two weeks before the rhythm settles. If something is not working by then, raise it directly — early, specific feedback is kinder than silence.`,
  },
];

// ---------------------------------- Seed -----------------------------------

async function main() {
  console.log("Seeding CareNest…");
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // Categories -------------------------------------------------------------
  const categoryMap = new Map<string, string>();
  for (const category of CATEGORIES) {
    const row = await prisma.careCategory.upsert({
      where: { slug: category.slug },
      update: { ...category, isActive: true, isCareType: true },
      create: {
        ...category,
        isActive: true,
        isCareType: true,
        seoTitle: `Find a ${category.singular.toLowerCase()} near you`,
        seoDescription: category.description,
      },
    });
    categoryMap.set(category.slug, row.id);
  }

  // Locations --------------------------------------------------------------
  for (const [slug, city, state, stateCode, lat, lng] of LOCATIONS as [
    string,
    string,
    string,
    string,
    number,
    number,
  ][]) {
    await prisma.location.upsert({
      where: { slug },
      update: { city, state, stateCode, latitude: lat, longitude: lng, isActive: true },
      create: {
        slug,
        city,
        state,
        stateCode,
        latitude: lat,
        longitude: lng,
        isActive: true,
        isFeatured: ["new-york", "boston", "seattle", "chicago"].includes(slug),
        description: `Find nannies, babysitters and senior caregivers in ${city}, ${state}.`,
      },
    });
  }

  // Plans ------------------------------------------------------------------
  const plans = [
    {
      slug: "family-free",
      name: "Family Free",
      audience: "FAMILY",
      tagline: "Everything you need to start looking",
      priceMonthlyCents: 0,
      priceAnnualCents: 0,
      searchLimit: 10,
      contactLimit: 2,
      jobPostLimit: 1,
      applicationLimit: null,
      features: [
        "Create a family profile",
        "Browse caregiver profiles",
        "Publish 1 active job",
        "Review applications",
        "5 saved caregivers",
      ],
      sortOrder: 1,
      isPopular: false,
    },
    {
      slug: "family-premium",
      name: "Family Premium",
      audience: "FAMILY",
      tagline: "Unlimited search, contact and hiring tools",
      priceMonthlyCents: 2999,
      priceAnnualCents: 29990,
      searchLimit: null,
      contactLimit: null,
      jobPostLimit: null,
      applicationLimit: null,
      features: [
        "Unlimited caregiver search",
        "Unlimited messaging and contacts",
        "Publish unlimited jobs",
        "Advanced filters and saved searches",
        "Priority applicant notifications",
        "Interview scheduling and reminders",
      ],
      sortOrder: 2,
      isPopular: true,
    },
    {
      slug: "caregiver-free",
      name: "Caregiver Free",
      audience: "CAREGIVER",
      tagline: "Build your profile and start applying",
      priceMonthlyCents: 0,
      priceAnnualCents: 0,
      searchLimit: null,
      contactLimit: 3,
      jobPostLimit: null,
      applicationLimit: 3,
      features: [
        "Professional caregiver profile",
        "Apply to 3 jobs per month",
        "Save jobs",
        "Basic profile analytics",
      ],
      sortOrder: 1,
      isPopular: false,
    },
    {
      slug: "caregiver-premium",
      name: "Caregiver Premium",
      audience: "CAREGIVER",
      tagline: "Get seen by more families and apply freely",
      priceMonthlyCents: 1499,
      priceAnnualCents: 14990,
      searchLimit: null,
      contactLimit: null,
      jobPostLimit: null,
      applicationLimit: null,
      features: [
        "Unlimited job applications",
        "Featured profile placement",
        "Full profile analytics",
        "Priority message delivery",
        "Early access to new jobs",
      ],
      sortOrder: 2,
      isPopular: true,
    },
    {
      slug: "agency-business",
      name: "Agency Business",
      audience: "AGENCY",
      tagline: "Manage a roster, placements and analytics",
      priceMonthlyCents: 9900,
      priceAnnualCents: 99000,
      searchLimit: null,
      contactLimit: null,
      jobPostLimit: null,
      applicationLimit: null,
      features: [
        "Up to 25 caregiver accounts",
        "Agency profile and branding",
        "Bulk job management",
        "Candidate pipeline",
        "Placement tracking",
        "Agency analytics and billing",
      ],
      sortOrder: 1,
      isPopular: true,
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { slug: plan.slug },
      update: {
        ...plan,
        features: JSON.stringify(plan.features),
        isActive: true,
        trialDays: plan.priceMonthlyCents > 0 ? 14 : 0,
      },
      create: {
        ...plan,
        features: JSON.stringify(plan.features),
        isActive: true,
        trialDays: plan.priceMonthlyCents > 0 ? 14 : 0,
      },
    });
  }

  // Users ------------------------------------------------------------------
  const makeUser = async (data: {
    email: string;
    firstName: string;
    lastName: string;
    role: "FAMILY" | "CAREGIVER" | "AGENCY" | "ADMIN";
    city: string;
    state: string;
    zip: string;
    phone?: string;
    verified?: boolean;
  }) => {
    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: { role: data.role },
      create: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        city: data.city,
        state: data.state,
        zip: data.zip,
        phone: data.phone ?? null,
        emailVerifiedAt: data.verified === false ? null : daysAgo(30),
        phoneVerifiedAt: data.phone ? daysAgo(20) : null,
      },
    });
    await prisma.userRole.upsert({
      where: { userId_role: { userId: user.id, role: data.role } },
      update: {},
      create: { userId: user.id, role: data.role },
    });
    await prisma.notificationPreference.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });
    return user;
  };

  const admin = await makeUser({
    email: "admin@carenest.dev",
    firstName: "Ava",
    lastName: "Morgan",
    role: "ADMIN",
    city: "New York",
    state: "New York",
    zip: "10001",
    phone: "+1 212 555 0100",
  });

  const family = await makeUser({
    email: "sarah@carenest.dev",
    firstName: "Sarah",
    lastName: "Whitfield",
    role: "FAMILY",
    city: "Boston",
    state: "Massachusetts",
    zip: "02118",
    phone: "+1 617 555 0142",
  });

  const family2 = await makeUser({
    email: "marcus@carenest.dev",
    firstName: "Marcus",
    lastName: "Lee",
    role: "FAMILY",
    city: "Seattle",
    state: "Washington",
    zip: "98103",
    phone: "+1 206 555 0177",
  });

  const agencyUser = await makeUser({
    email: "agency@carenest.dev",
    firstName: "Iris",
    lastName: "Chen",
    role: "AGENCY",
    city: "Boston",
    state: "Massachusetts",
    zip: "02116",
    phone: "+1 617 555 0199",
  });

  for (const [userId, data] of [
    [
      family.id,
      {
        headline: "Working parents of two in the South End",
        about:
          "We are looking for a warm, reliable nanny for our two children (4 and 18 months). We value outdoor time, reading and a calm routine.",
        childrenCount: 2,
        childrenAges: JSON.stringify(["4 years", "18 months"]),
        careNeeds: JSON.stringify(["nanny", "babysitter"]),
      },
    ],
    [
      family2.id,
      {
        headline: "Family in Fremont looking for after-school care",
        about:
          "Two school-age kids who need help with homework and getting to activities. We would love someone consistent who enjoys being outdoors.",
        childrenCount: 2,
        childrenAges: JSON.stringify(["8 years", "11 years"]),
        careNeeds: JSON.stringify(["childcare"]),
      },
    ],
  ] as const) {
    await prisma.familyProfile.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        addressLine: "24 Clarendon Street",
        city: userId === family.id ? "Boston" : "Seattle",
        state: userId === family.id ? "Massachusetts" : "Washington",
        zip: userId === family.id ? "02118" : "98103",
        latitude: userId === family.id ? 42.3439 : 47.6733,
        longitude: userId === family.id ? -71.0706 : -122.3425,
        onboardingComplete: true,
        emergencyContact: "Emergency contact on file",
        ...data,
      },
    });
  }

  const agency = await prisma.agencyProfile.upsert({
    where: { userId: agencyUser.id },
    update: {},
    create: {
      userId: agencyUser.id,
      slug: "nest-and-nurture",
      name: "Nest & Nurture Agency",
      about:
        "A boutique Boston agency placing experienced nannies and newborn care specialists with families who value continuity of care. Every nanny is interviewed, referenced and background checked before placement.",
      city: "Boston",
      state: "Massachusetts",
      zip: "02116",
      latitude: 42.3505,
      longitude: -71.0749,
      website: "https://www.example.com",
      contactEmail: "hello@nestandnurture.example",
      contactPhone: "+1 617 555 0199",
      licenseNumber: "MA-AG-2291",
      licenseVerifiedAt: daysAgo(90),
      status: "VERIFIED",
      ratingAvg: 4.8,
      ratingCount: 6,
    },
  });

  const caregiverUsers: { profileId: string; userId: string; data: SeedCaregiver }[] = [];

  for (const data of CAREGIVERS) {
    const user = await makeUser({
      email: `${data.first.toLowerCase()}@carenest.dev`,
      firstName: data.first,
      lastName: data.last,
      role: "CAREGIVER",
      city: data.city,
      state: data.state,
      zip: data.zip,
      phone: "+1 555 0100",
    });

    const profile = await prisma.caregiverProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        slug: data.slug,
        headline: data.headline,
        bio: data.bio,
        city: data.city,
        state: data.state,
        zip: data.zip,
        latitude: data.lat,
        longitude: data.lng,
        yearsExperience: data.years,
        hourlyRateCents: data.rate,
        rateType: data.rateType ?? "HOURLY",
        employmentType: data.employment,
        livingArrangement: data.living,
        minHoursPerWeek: data.employment === "FULL_TIME" ? 30 : 4,
        maxHoursPerWeek: 45,
        willingToTravel: true,
        travelRadiusKm: 25,
        languages: data.languages.join(","),
        specialNeeds: data.specialNeeds.join(","),
        isPublished: true,
        isFeatured: Boolean(data.featured),
        ratingAvg: data.rating,
        ratingCount: data.ratingCount,
        profileViews: 40 + data.ratingCount * 7,
        completedHires: Math.max(1, Math.round(data.ratingCount / 2)),
        responseRate: 92,
        identityVerifiedAt: data.identityVerified ? daysAgo(60) : null,
        backgroundCheckAt: data.backgroundChecked ? daysAgo(45) : null,
        qualificationsVerifiedAt: data.qualificationsVerified ? daysAgo(30) : null,
        referencesVerifiedAt: data.identityVerified ? daysAgo(40) : null,
        verificationStatus: data.identityVerified
          ? "VERIFIED"
          : data.published
            ? "PENDING"
            : "UNVERIFIED",
        agencyId: data.agency ? agency.id : null,
      },
    });

    for (const slug of data.categories) {
      const categoryId = categoryMap.get(slug);
      if (!categoryId) continue;
      await prisma.caregiverCategory.upsert({
        where: { caregiverId_categoryId: { caregiverId: profile.id, categoryId } },
        update: {},
        create: { caregiverId: profile.id, categoryId },
      });
    }

    for (const skill of data.skills) {
      await prisma.caregiverSkill.upsert({
        where: { caregiverId_name: { caregiverId: profile.id, name: skill } },
        update: {},
        create: { caregiverId: profile.id, name: skill, level: "EXPERT" },
      });
    }

    for (const experience of data.experience) {
      const existing = await prisma.caregiverExperience.findFirst({
        where: { caregiverId: profile.id, employer: experience.employer },
      });
      if (!existing) {
        await prisma.caregiverExperience.create({
          data: {
            caregiverId: profile.id,
            employer: experience.employer,
            title: experience.title,
            startDate: daysAgo(experience.years * 365),
            endDate: daysAgo(30),
            description: `${experience.title} for ${experience.years} years.`,
          },
        });
      }
    }

    for (const cert of data.certifications) {
      const existing = await prisma.caregiverCertification.findFirst({
        where: { caregiverId: profile.id, name: cert.name },
      });
      if (!existing) {
        await prisma.caregiverCertification.create({
          data: {
            caregiverId: profile.id,
            name: cert.name,
            issuer: cert.issuer,
            issuedAt: daysAgo(500),
            verifiedAt: cert.verified ? daysAgo(120) : null,
          },
        });
      }
    }

    const existingAvailability = await prisma.caregiverAvailability.count({
      where: { caregiverId: profile.id },
    });
    if (!existingAvailability) {
      const weekdays = data.employment === "PART_TIME" ? [5, 6] : [1, 2, 3, 4, 5];
      await prisma.caregiverAvailability.createMany({
        data: weekdays.map((dayOfWeek) => ({
          caregiverId: profile.id,
          dayOfWeek,
          startMinute: data.employment === "PART_TIME" ? 17 * 60 : 8 * 60,
          endMinute: data.employment === "PART_TIME" ? 22 * 60 : 18 * 60,
        })),
      });
    }

    caregiverUsers.push({ profileId: profile.id, userId: user.id, data });
  }

  // Jobs -------------------------------------------------------------------
  type SeedJob = {
    slug: string;
    title: string;
    category: string;
    ownerId: string;
    city: string;
    state: string;
    zip: string;
    description: string;
    requirements: string[];
    employmentType: string;
    livingArrangement: string;
    schedule: string;
    budgetMin: number;
    budgetMax: number | null;
    budgetType: string;
    experienceYears: number;
    featured: boolean;
    status: string;
    agencyId?: string;
  };
  const jobSeeds: SeedJob[] = [
    {
      slug: "full-time-nanny-boston-south-end",
      title: "Full-time nanny for two children in the South End",
      category: "nanny",
      ownerId: family.id,
      city: "Boston",
      state: "Massachusetts",
      zip: "02118",
      description:
        "We are looking for an experienced, warm nanny for our two children (4 years and 18 months). The role is Monday to Friday, 8am to 6pm, with a focus on routines, outdoor play and early reading. You will handle school drop-off and pickup for our older child, prepare simple meals, and keep a daily log so we can stay involved. We are looking for someone who is calm, punctual and genuinely enjoys the toddler stage. Long-term commitment preferred; we hope to work with the same person for years.",
      requirements: ["3+ years nanny experience", "CPR & First Aid certified", "Clean driving record", "Non-smoker"],
      employmentType: "FULL_TIME",
      livingArrangement: "LIVE_OUT",
      schedule: "Mon–Fri, 8:00 AM – 6:00 PM",
      budgetMin: 2600,
      budgetMax: 3200,
      budgetType: "HOURLY",
      experienceYears: 3,
      featured: true,
      status: "PUBLISHED",
    },
    {
      slug: "after-school-care-seattle-fremont",
      title: "After-school caregiver for two school-age children",
      category: "childcare",
      ownerId: family2.id,
      city: "Seattle",
      state: "Washington",
      zip: "98103",
      description:
        "We need help from 3pm to 6:30pm on weekdays with homework, snacks and getting to two activities nearby. Our children are 8 and 11 and are fairly independent, but they need an adult who will hold the routine. We would love someone who can help with reading and is comfortable driving (mileage reimbursed).",
      requirements: ["Experience with school-age children", "Reliable transport", "Homework support"],
      employmentType: "PART_TIME",
      livingArrangement: "LIVE_OUT",
      schedule: "Mon–Fri, 3:00 PM – 6:30 PM",
      budgetMin: 2200,
      budgetMax: 2600,
      budgetType: "HOURLY",
      experienceYears: 2,
      featured: true,
      status: "PUBLISHED",
    },
    {
      slug: "special-needs-caregiver-new-york",
      title: "Special needs caregiver for a 7-year-old (weekdays)",
      category: "special-needs",
      ownerId: family.id,
      city: "New York",
      state: "New York",
      zip: "10003",
      description:
        "Our son is 7, autistic and non-speaking. We are looking for an experienced caregiver to support him after school and during school holidays. Experience with AAC devices, sensory regulation and positive behaviour support is essential. You will work alongside his speech and occupational therapists, and we will train you on his communication system.",
      requirements: [
        "Autism experience",
        "AAC or PECS familiarity",
        "Positive behaviour support training",
        "References from two families",
      ],
      employmentType: "PART_TIME",
      livingArrangement: "LIVE_OUT",
      schedule: "Mon–Fri, 3:30 PM – 7:00 PM",
      budgetMin: 3500,
      budgetMax: 4500,
      budgetType: "HOURLY",
      experienceYears: 4,
      featured: false,
      status: "PUBLISHED",
    },
    {
      slug: "senior-companion-chicago-lakeview",
      title: "Companion and morning support for an 82-year-old",
      category: "senior-care",
      ownerId: family2.id,
      city: "Chicago",
      state: "Illinois",
      zip: "60614",
      description:
        "We are looking for a patient companion for my mother, who lives independently but needs help with breakfast, medication reminders and getting to appointments twice a week. She loves gardening, crosswords and classical music. Early-stage dementia experience preferred. This is a warm, long-term role with a lovely person.",
      requirements: ["Dementia experience", "Meal preparation", "Valid driver's licence"],
      employmentType: "PART_TIME",
      livingArrangement: "LIVE_OUT",
      schedule: "Mon, Wed, Fri, 8:00 AM – 12:00 PM",
      budgetMin: 2400,
      budgetMax: 2800,
      budgetType: "HOURLY",
      experienceYears: 2,
      featured: false,
      status: "PUBLISHED",
    },
    {
      slug: "live-in-nanny-san-francisco",
      title: "Live-in nanny and household manager",
      category: "nanny",
      ownerId: family.id,
      city: "San Francisco",
      state: "California",
      zip: "94110",
      description:
        "Busy two-doctor household looking for a live-in nanny and household manager. Private suite with own bathroom provided. You will own the children's schedule (6 and 9), school runs, cooking for the family and the household calendar. Travel with the family twice a year. This is a long-term role for someone who wants to be part of a family.",
      requirements: ["5+ years experience", "Cooking for families", "Travel flexibility", "Driver's licence"],
      employmentType: "FULL_TIME",
      livingArrangement: "LIVE_IN",
      schedule: "Mon–Fri, with occasional weekend travel",
      budgetMin: 3000,
      budgetMax: 3600,
      budgetType: "HOURLY",
      experienceYears: 5,
      featured: true,
      status: "PUBLISHED",
    },
    {
      slug: "weekly-housekeeper-denver",
      title: "Weekly housekeeper for a family home",
      category: "housekeeping",
      ownerId: family2.id,
      city: "Denver",
      state: "Colorado",
      zip: "80206",
      description:
        "We are looking for a reliable housekeeper for a weekly clean of a four-bedroom home. Tasks include bathrooms, kitchen, floors, laundry and changing bed linen. We have a friendly dog. Eco-friendly products preferred. Flexible on the day of the week.",
      requirements: ["2+ years housekeeping experience", "Pet friendly", "Own transport"],
      employmentType: "OCCASIONAL",
      livingArrangement: "LIVE_OUT",
      schedule: "One day per week, 9:00 AM – 2:00 PM",
      budgetMin: 2000,
      budgetMax: 2400,
      budgetType: "HOURLY",
      experienceYears: 2,
      featured: false,
      status: "PUBLISHED",
    },
    {
      slug: "overnight-pet-sitter-austin",
      title: "Overnight pet sitter for two dogs",
      category: "pet-care",
      ownerId: family.id,
      city: "Austin",
      state: "Texas",
      zip: "78704",
      description:
        "We travel for work several times a month and need an overnight sitter for two friendly labradors. Feeding twice a day, one long walk, and lots of company. Our dogs are used to sleeping indoors. We would like someone who can stay the night, not just drop in.",
      requirements: ["Experience with large dogs", "Overnight availability", "Pet first aid preferred"],
      employmentType: "OCCASIONAL",
      livingArrangement: "LIVE_OUT",
      schedule: "2–5 nights per month, including overnight",
      budgetMin: 1800,
      budgetMax: 2200,
      budgetType: "HOURLY",
      experienceYears: 1,
      featured: false,
      status: "PUBLISHED",
    },
    {
      slug: "weekend-babysitter-brooklyn",
      title: "Weekend babysitter for a toddler in Park Slope",
      category: "babysitter",
      ownerId: family2.id,
      city: "New York",
      state: "New York",
      zip: "11215",
      description:
        "We need an occasional weekend babysitter for our 2-year-old, usually Saturday evenings. Bedtime routine is simple: bath, story, bed by 7:30pm. We are close to the park and would love someone who enjoys getting outside during the day too.",
      requirements: ["Toddler experience", "CPR preferred", "Non-smoker"],
      employmentType: "OCCASIONAL",
      livingArrangement: "LIVE_OUT",
      schedule: "Saturdays, 4:00 PM – 11:00 PM (occasional)",
      budgetMin: 1800,
      budgetMax: 2200,
      budgetType: "HOURLY",
      experienceYears: 1,
      featured: false,
      status: "PUBLISHED",
    },
    {
      slug: "agency-newborn-care-boston",
      title: "Newborn care specialist placement (agency)",
      category: "nanny",
      ownerId: agencyUser.id,
      city: "Boston",
      state: "Massachusetts",
      zip: "02116",
      description:
        "Nest & Nurture is placing a newborn care specialist with a family expecting twins in the spring. Twelve weeks of daytime support, with a focus on feeding routines, sleep shaping and parent coaching. Agency placement: we handle payroll and check-ins every two weeks.",
      requirements: ["Newborn care certification", "Twins experience", "3+ references"],
      employmentType: "FULL_TIME",
      livingArrangement: "LIVE_OUT",
      schedule: "Mon–Fri, 7:00 AM – 3:00 PM for 12 weeks",
      budgetMin: 3200,
      budgetMax: 4000,
      budgetType: "HOURLY",
      experienceYears: 5,
      featured: true,
      status: "PUBLISHED",
      agencyId: agency.id,
    },
    {
      slug: "draft-part-time-mothers-helper",
      title: "Part-time mother's helper (draft)",
      category: "childcare",
      ownerId: family.id,
      city: "Boston",
      state: "Massachusetts",
      zip: "02118",
      description:
        "Draft job — a few afternoons a week to help with the children while I work from home. Still deciding on the schedule.",
      requirements: ["Experience with toddlers"],
      employmentType: "PART_TIME",
      livingArrangement: "LIVE_OUT",
      schedule: "Tue/Thu afternoons (to confirm)",
      budgetMin: 2000,
      budgetMax: null,
      budgetType: "HOURLY",
      experienceYears: 1,
      featured: false,
      status: "DRAFT",
    },
  ];

  const jobIds = new Map<string, string>();
  for (const job of jobSeeds) {
    const categoryId = categoryMap.get(job.category)!;
    const row = await prisma.careJob.upsert({
      where: { slug: job.slug },
      update: {},
      create: {
        slug: job.slug,
        ownerId: job.ownerId,
        agencyId: job.agencyId ?? null,
        categoryId,
        title: job.title,
        description: job.description,
        city: job.city,
        state: job.state,
        zip: job.zip,
        employmentType: job.employmentType,
        livingArrangement: job.livingArrangement,
        schedule: job.schedule,
        startDate: daysFromNow(14),
        durationMonths: 12,
        budgetType: job.budgetType,
        budgetMinCents: job.budgetMin,
        budgetMaxCents: job.budgetMax,
        experienceYears: job.experienceYears,
        caregiversNeeded: 1,
        status: job.status,
        publishedAt: job.status === "PUBLISHED" ? daysAgo(5) : null,
        isFeatured: job.featured,
        viewCount: 40 + Math.round(Math.random() * 200),
        languages: "English",
        requirements: {
          create: job.requirements.map((label, index) => ({
            label,
            isRequired: true,
            sortOrder: index,
          })),
        },
      },
    });
    jobIds.set(job.slug, row.id);
  }

  // Applications -----------------------------------------------------------
  const applicationSeeds: { job: string; caregiver: string; status: string }[] = [
    { job: "full-time-nanny-boston-south-end", caregiver: "amelia-hart", status: "SHORTLISTED" },
    { job: "full-time-nanny-boston-south-end", caregiver: "elena-petrov", status: "REVIEWING" },
    { job: "full-time-nanny-boston-south-end", caregiver: "hannah-kim", status: "SUBMITTED" },
    { job: "after-school-care-seattle-fremont", caregiver: "daniel-okafor", status: "HIRED" },
    { job: "after-school-care-seattle-fremont", caregiver: "jordan-reyes", status: "REJECTED" },
    { job: "special-needs-caregiver-new-york", caregiver: "priya-raman", status: "SHORTLISTED" },
    { job: "senior-companion-chicago-lakeview", caregiver: "grace-lindqvist", status: "INTERVIEW" },
    { job: "senior-companion-chicago-lakeview", caregiver: "kwame-asante", status: "SUBMITTED" },
    { job: "live-in-nanny-san-francisco", caregiver: "marcus-bell", status: "REVIEWING" },
    { job: "weekly-housekeeper-denver", caregiver: "nadia-haddad", status: "HIRED" },
  ];

  const applicationIds = new Map<string, string>();
  for (const [index, seed] of applicationSeeds.entries()) {
    const jobId = jobIds.get(seed.job);
    const caregiver = caregiverUsers.find((c) => c.data.slug === seed.caregiver);
    if (!jobId || !caregiver) continue;

    const application = await prisma.jobApplication.upsert({
      where: { jobId_caregiverId: { jobId, caregiverId: caregiver.profileId } },
      update: { status: seed.status },
      create: {
        jobId,
        caregiverId: caregiver.profileId,
        message: `Hello — I am ${caregiver.data.first}, and I would love to be considered for this role. I have ${caregiver.data.years} years of experience with ${caregiver.data.categories.join(", ")} and I am confident I can provide the consistency you are looking for. My certifications and references are on my profile, and I am available to interview this week.`,
        expectedRateCents: caregiver.data.rate,
        availableFrom: daysFromNow(10),
        status: seed.status,
        matchScore: 70 + ((index * 7) % 25),
        shortlistedAt: ["SHORTLISTED", "INTERVIEW", "HIRED"].includes(seed.status)
          ? daysAgo(3)
          : null,
        hiredAt: seed.status === "HIRED" ? daysAgo(2) : null,
        rejectedAt: seed.status === "REJECTED" ? daysAgo(2) : null,
        createdAt: daysAgo(6 + index),
      },
    });
    applicationIds.set(`${seed.job}:${seed.caregiver}`, application.id);
    await prisma.careJob.update({
      where: { id: jobId },
      data: { applicationCount: { increment: 1 } },
    });
  }

  // Interviews -------------------------------------------------------------
  const hiredApp = applicationIds.get("after-school-care-seattle-fremont:daniel-okafor");
  const interviewSeeds = [
    {
      key: "senior-companion-chicago-lakeview:grace-lindqvist",
      familyId: family2.id,
      caregiverSlug: "grace-lindqvist",
      type: "ONLINE",
      scheduledAt: daysFromNow(2),
      status: "PROPOSED",
    },
    {
      key: "after-school-care-seattle-fremont:daniel-okafor",
      familyId: family2.id,
      caregiverSlug: "daniel-okafor",
      type: "IN_PERSON",
      scheduledAt: daysAgo(4),
      status: "COMPLETED",
    },
  ];

  for (const seed of interviewSeeds) {
    const caregiver = caregiverUsers.find((c) => c.data.slug === seed.caregiverSlug);
    if (!caregiver) continue;
    const existing = await prisma.interview.findFirst({
      where: { familyId: seed.familyId, caregiverId: caregiver.userId },
    });
    if (existing) continue;
    await prisma.interview.create({
      data: {
        jobId: jobIds.get("senior-companion-chicago-lakeview") ?? null,
        applicationId:
          seed.key === "after-school-care-seattle-fremont:daniel-okafor" ? hiredApp : null,
        familyId: seed.familyId,
        caregiverId: caregiver.userId,
        createdById: seed.familyId,
        type: seed.type,
        scheduledAt: seed.scheduledAt,
        durationMinutes: 30,
        timezone: "America/Los_Angeles",
        meetingLink: seed.type === "ONLINE" ? "https://meet.example.com/carenest-interview" : null,
        location: seed.type === "IN_PERSON" ? "Fremont Coffee House, Seattle" : null,
        notes: "First conversation — routines, availability and references.",
        status: seed.status,
      },
    });
  }

  // Reviews ----------------------------------------------------------------
  type SeedReview = {
    authorId: string;
    caregiverSlug: string;
    applicationKey: string | null;
    rating: number;
    title: string;
    body: string;
    response: string | null;
    job: string | null;
    isVerified?: boolean;
  };
  const reviewSeeds: SeedReview[] = [
    {
      authorId: family2.id,
      caregiverSlug: "daniel-okafor",
      applicationKey: "after-school-care-seattle-fremont:daniel-okafor",
      rating: 5,
      title: "Reliable, kind and great with homework",
      body:
        "Daniel has been with us for a term and the difference is enormous. The children actually finish their homework, and he keeps them active instead of on screens. He communicates clearly and is always on time.",
      response:
        "Thank you so much — it has been a joy working with your family. The kids make it easy.",
      job: "after-school-care-seattle-fremont",
    },
    {
      authorId: family2.id,
      caregiverSlug: "nadia-haddad",
      applicationKey: "weekly-housekeeper-denver:nadia-haddad",
      rating: 5,
      title: "The most thorough clean we have had",
      body:
        "Nadia is meticulous and completely trustworthy. She works around our dog without any fuss and the house smells wonderful without harsh chemicals. We have booked her weekly.",
      response: null,
      job: "weekly-housekeeper-denver",
    },
    {
      authorId: family.id,
      caregiverSlug: "amelia-hart",
      applicationKey: null,
      rating: 5,
      title: "Exactly the calm presence we needed",
      body:
        "We interviewed Amelia for our nanny role and she was outstanding — prepared, warm and full of practical ideas for our toddler's routine. We would recommend her without hesitation.",
      response: "Thank you, Sarah. It was a pleasure meeting your family.",
      job: null,
      isVerified: false,
    },
  ];

  for (const seed of reviewSeeds) {
    const caregiver = caregiverUsers.find((c) => c.data.slug === seed.caregiverSlug);
    if (!caregiver) continue;
    const applicationId = seed.applicationKey ? applicationIds.get(seed.applicationKey) : null;
    const existing = await prisma.review.findFirst({
      where: { authorId: seed.authorId, caregiverId: caregiver.profileId, title: seed.title },
    });
    if (existing) continue;
    await prisma.review.create({
      data: {
        authorId: seed.authorId,
        caregiverId: caregiver.profileId,
        jobId: seed.job ? jobIds.get(seed.job) ?? null : null,
        applicationId,
        rating: seed.rating,
        title: seed.title,
        body: seed.body,
        isVerified: Boolean(applicationId),
        status: "PUBLISHED",
        responseBody: seed.response,
        respondedAt: seed.response ? daysAgo(1) : null,
      },
    });
  }

  // Conversations ----------------------------------------------------------
  const existingConversation = await prisma.conversation.findFirst({
    where: { participants: { some: { userId: family.id } } },
  });

  if (!existingConversation) {
    const conversation = await prisma.conversation.create({
      data: {
        subject: "Full-time nanny role in the South End",
        type: "JOB",
        jobId: jobIds.get("full-time-nanny-boston-south-end") ?? null,
        lastMessageAt: daysAgo(1),
        lastMessagePreview: "That sounds great — would Thursday at 10am work?",
        participants: {
          create: [
            { userId: family.id, lastReadAt: daysAgo(1) },
            { userId: caregiverUsers.find((c) => c.data.slug === "amelia-hart")!.userId },
          ],
        },
      },
    });

    const ameliaId = caregiverUsers.find((c) => c.data.slug === "amelia-hart")!.userId;
    await prisma.message.createMany({
      data: [
        {
          conversationId: conversation.id,
          senderId: family.id,
          body:
            "Hi Amelia — your profile looks like a wonderful fit for our family. We are looking for Monday to Friday care for our 4-year-old and 18-month-old. Would you be open to a chat this week?",
          createdAt: daysAgo(2),
          readAt: daysAgo(2),
        },
        {
          conversationId: conversation.id,
          senderId: ameliaId,
          body:
            "Hello Sarah, thank you for reaching out. I would love to talk — your routine sounds very close to what I am looking for. I am free Thursday morning or Friday afternoon.",
          createdAt: daysAgo(1),
          readAt: daysAgo(1),
        },
        {
          conversationId: conversation.id,
          senderId: family.id,
          body: "That sounds great — would Thursday at 10am work?",
          createdAt: daysAgo(1),
        },
      ],
    });
  }

  // Notifications ----------------------------------------------------------
  const notificationCount = await prisma.notification.count({ where: { userId: family.id } });
  if (notificationCount === 0) {
    await prisma.notification.createMany({
      data: [
        {
          userId: family.id,
          type: "NEW_APPLICATION",
          title: "Amelia Hart applied to your nanny job",
          body: "A caregiver with 9 years of experience applied to “Full-time nanny for two children in the South End”.",
          link: "/dashboard/family/applications",
          createdAt: daysAgo(2),
        },
        {
          userId: family.id,
          type: "NEW_MESSAGE",
          title: "New message from Amelia Hart",
          body: "I am free Thursday morning or Friday afternoon.",
          link: "/dashboard/messages",
          createdAt: daysAgo(1),
        },
        {
          userId: family.id,
          type: "INTERVIEW_INVITE",
          title: "Interview confirmed",
          body: "Your interview with Grace Lindqvist is scheduled for this week.",
          link: "/dashboard/family/interviews",
          createdAt: daysAgo(1),
          isRead: true,
          readAt: daysAgo(1),
        },
      ],
    });
  }

  // Trust & safety ---------------------------------------------------------
  const existingVerification = await prisma.verificationRequest.findFirst({
    where: { userId: caregiverUsers[4]!.userId },
  });
  if (!existingVerification) {
    await prisma.verificationRequest.create({
      data: {
        userId: caregiverUsers[4]!.userId, // Tomás — unverified caregiver
        type: "IDENTITY",
        status: "PENDING",
        provider: "MANUAL",
        submittedData: JSON.stringify({ fullLegalName: "Tomás Ferreira" }),
      },
    });
  }

  const existingReport = await prisma.report.findFirst({ where: { reporterId: family2.id } });
  if (!existingReport) {
    await prisma.report.create({
      data: {
        reporterId: family2.id,
        targetType: "JOB",
        targetJobId: jobIds.get("overnight-pet-sitter-austin") ?? null,
        reason: "other",
        details:
          "The budget on this listing looks unrealistic for overnight care in this area. Flagging for review.",
        status: "OPEN",
      },
    });
  }

  // Content ----------------------------------------------------------------
  for (const [index, faq] of FAQS.entries()) {
    const existing = await prisma.faq.findFirst({ where: { question: faq.question } });
    if (!existing) {
      await prisma.faq.create({ data: { ...faq, sortOrder: index, isActive: true } });
    }
  }

  for (const [index, testimonial] of TESTIMONIALS.entries()) {
    const existing = await prisma.testimonial.findFirst({
      where: { authorName: testimonial.authorName },
    });
    if (!existing) {
      await prisma.testimonial.create({ data: { ...testimonial, sortOrder: index, isActive: true } });
    }
  }

  for (const post of BLOG_POSTS) {
    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: {},
      create: {
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        authorName: "CareNest Editorial",
        category: post.category,
        status: "PUBLISHED",
        publishedAt: daysAgo(Math.round(Math.random() * 40) + 1),
        seoTitle: post.title,
        seoDescription: post.excerpt,
      },
    });
  }

  const pages = [
    {
      slug: "about",
      title: "About CareNest",
      subtitle: "A marketplace built around trust, not transactions.",
      showInFooter: true,
      content: `CareNest started with a simple observation: finding care for the people you love is one of the most important decisions a family makes, and yet it is usually made with very little information.

## What we do

We give families a place to search real caregiver profiles, publish detailed jobs and interview candidates directly. We give caregivers a professional profile that shows their experience, certifications and availability — and a way to be found by families who are genuinely looking.

## What we do not do

We are not a care provider. We do not employ caregivers, and we do not guarantee any caregiver's safety. What we can do is make the process more transparent: verified contact details, reviewed documents, honest reviews from families who actually hired, and reporting tools when something feels wrong.

## Our principles

- **Transparency over promises.** A badge means a check was completed — nothing more.
- **Privacy by default.** Documents and contact details are never public.
- **Human decisions.** Software can help you compare, but you should always interview and check references.`,
    },
    {
      slug: "safety",
      title: "Safety & Trust",
      subtitle: "How verification works, and what you should check yourself.",
      showInFooter: true,
      content: `## Verification is layered

Every account can verify an email address and phone number. Caregivers and agencies can go further by submitting identity documents, certifications and references for review.

**A document upload alone never creates a badge.** Each verification type shows separately:

- Email verified
- Phone verified
- Identity verified
- Background check completed
- Qualifications reviewed
- References checked

## What we review

Our trust & safety team reviews identity documents against the name on the account, checks that certificates match the issuing body, and confirms that references respond. Requests can be approved, declined, or returned for more information.

## What you must still do

- Interview every candidate, ideally by video first.
- Ask for two references and actually call them.
- Confirm certifications with the issuing organisation.
- Start with a short trial period and agree terms in writing.
- Never send money before a signed agreement.

## Reporting

Every profile, job, review and conversation can be reported. Reports are reviewed by our team, and we can warn, suspend or remove accounts. If a child may be at immediate risk, contact your local emergency services first.`,
    },
    {
      slug: "terms",
      title: "Terms of Service",
      showInFooter: true,
      content: `## 1. Agreement

By creating an account you agree to these terms. If you do not agree, do not use CareNest.

## 2. The marketplace

CareNest is a platform that connects families and caregivers. We are not an employer, recruitment agency or care provider. Any agreement you reach is between you and the other party.

## 3. Accounts

You must be 18 or older, provide accurate information and keep your credentials secure. You are responsible for activity on your account.

## 4. Acceptable use

You may not post false information, impersonate anyone, harass other users, circumvent verification, scrape the platform or use it for anything unlawful.

## 5. Subscriptions

Paid plans renew automatically until cancelled. You can cancel at any time from your billing page; access continues to the end of the current period. Prices are shown before checkout.

## 6. Content

You keep ownership of the content you upload and grant us a licence to display it on the platform. We may remove content that breaks these terms.

## 7. Verification and disclaimers

Verification reflects checks we completed at a point in time. It is not a guarantee of safety, competence or suitability. The platform is provided "as is" to the extent permitted by law.

## 8. Suspension

We may suspend or close accounts that break these terms or create risk for other users.

## 9. Changes

We may update these terms and will post the new version with an effective date.`,
    },
    {
      slug: "privacy",
      title: "Privacy Policy",
      showInFooter: true,
      content: `## What we collect

- Account details: name, email, phone number and location.
- Profile content: photos, experience, certifications and availability.
- Activity: jobs, applications, messages, interviews and reviews.
- Payment metadata from our payment processor (we never store card numbers).
- Technical data: IP address, device and session information, used for security.

## Children's data

CareNest is for adults. Families should never upload a child's identity documents, school details or medical records to a public profile. Keep sensitive details in private messages, and only share what the other party needs.

## How we use data

To operate the marketplace, verify accounts, prevent fraud and abuse, send notifications you have asked for, and improve the product. We do not sell personal data.

## Document storage

Uploaded identity and background documents are private. They are visible only to you and to authorised trust & safety staff, and are stored outside the public web root.

## Your rights

You can access, correct or delete your data from account settings, and you can request a copy by contacting us. Some records (for example payment history) may be retained where the law requires it.

## Retention

We keep account data while your account is active and for a reasonable period afterwards to meet legal and safety obligations.`,
    },
    {
      slug: "help",
      title: "Help Center",
      subtitle: "Answers to the questions we hear most.",
      showInFooter: true,
      content: `## Getting started

**How do I create an account?** Choose "Join now", pick whether you are a family, a caregiver or an agency, and complete your profile. You can switch between family and caregiver only by creating a separate account.

**Why should I verify my email?** Verification unlocks messaging, applications and job posting, and it protects your account.

## For families

**How do I post a job?** Go to Dashboard → My Jobs → Post a job. Published jobs appear in the care jobs directory immediately.

**How do I hire someone?** Open the application and choose "Hire". This marks the position as filled and unlocks a verified review.

## For caregivers

**How do I get more profile views?** Complete every section of your profile — photo, headline, skills, availability and at least one certification. Profiles above 80% completion receive significantly more contact.

**Can I apply to jobs without a paid plan?** Yes. Free accounts can apply to three jobs per month.

## Billing

**How do I cancel?** Dashboard → Subscription → Cancel plan. You keep access until the end of the period.

Still stuck? Use the contact form and our team will reply within one business day.`,
    },
    {
      slug: "how-it-works",
      title: "How CareNest Works",
      subtitle: "From first search to first day, in five steps.",
      showInFooter: false,
      content: `## For families

1. **Create your family profile.** Tell us what care you need, where, and when.
2. **Search and compare.** Filter by experience, rate, availability, languages and verification status. Save the profiles you like.
3. **Post a job.** Publish a detailed role so caregivers can apply to you.
4. **Message and interview.** Chat in-platform, shortlist applicants and schedule interviews.
5. **Hire and review.** Mark your chosen caregiver as hired and leave a verified review afterwards.

## For caregivers

1. **Build your profile.** Add experience, skills, certifications and availability.
2. **Get verified.** Submit your ID and certificates for review — badges only appear after a real check.
3. **Apply with a message.** Send a short, specific note with each application.
4. **Interview.** Accept invitations, or propose a new time.
5. **Get hired and build your reputation.** Verified reviews make the next hire easier.`,
    },
  ];

  for (const page of pages) {
    await prisma.cMSPage.upsert({
      where: { slug: page.slug },
      update: {},
      create: {
        ...page,
        status: "PUBLISHED",
        seoTitle: page.title,
        seoDescription: page.subtitle ?? page.title,
      },
    });
  }

  // Settings ---------------------------------------------------------------
  const settings = [
    ["site.name", "CareNest", "general", "Platform name", "text"],
    ["site.supportEmail", "support@carenest.example", "general", "Support email", "text"],
    ["site.tagline", "Find Trusted Care. Build Meaningful Connections.", "general", "Tagline", "text"],
    ["fees.platformBps", String(process.env.PLATFORM_FEE_BPS ?? 500), "billing", "Platform fee (basis points)", "number"],
    ["fees.currency", "usd", "billing", "Default currency", "text"],
    ["limits.freeContactPerMonth", "2", "limits", "Free plan contacts per month", "number"],
    ["limits.freeApplicationsPerMonth", "3", "limits", "Free plan applications per month", "number"],
    ["messaging.ratePerMinute", "20", "messaging", "Messages allowed per minute", "number"],
    ["trust.requireEmailVerification", "true", "trust", "Require email verification for actions", "boolean"],
    ["trust.autoPublishReviews", "false", "trust", "Publish reviews without moderation", "boolean"],
  ];
  for (const [key, value, group, label, type] of settings) {
    await prisma.platformSetting.upsert({
      where: { key },
      update: {},
      create: { key, value, group, label, type },
    });
  }

  // Email templates --------------------------------------------------------
  const templates = [
    {
      key: "WELCOME",
      name: "Welcome to CareNest, {{firstName}}",
      subject: "Welcome to CareNest — let's get you set up",
      body: `<p style="margin:0 0 16px;color:#374151;line-height:1.6">Hi {{firstName}},</p>
<p style="margin:0 0 16px;color:#374151;line-height:1.6">Welcome to CareNest. Your account is ready. The next step is to complete your profile so the right people can find you.</p>
<p style="margin:0 0 16px"><a href="{{appUrl}}{{dashboardPath}}" style="display:inline-block;background:#0f766e;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:600">Complete your profile</a></p>
<p style="margin:0;color:#6b7280;font-size:13px">If you did not create this account, you can ignore this email.</p>`,
    },
    {
      key: "VERIFY_EMAIL",
      name: "Confirm your email address",
      subject: "Confirm your CareNest email address",
      body: `<p style="margin:0 0 16px;color:#374151;line-height:1.6">Hi {{firstName}}, please confirm your email address to unlock messaging, applications and job posting.</p>
<p style="margin:0 0 16px"><a href="{{appUrl}}/verify-email/{{token}}" style="display:inline-block;background:#0f766e;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:600">Verify my email</a></p>
<p style="margin:0;color:#6b7280;font-size:13px">This link expires in 24 hours.</p>`,
    },
    {
      key: "NEW_APPLICATION",
      name: "New application for {{jobTitle}}",
      subject: "New application: {{jobTitle}}",
      body: `<p style="margin:0 0 16px;color:#374151;line-height:1.6">{{caregiverName}} applied to <strong>{{jobTitle}}</strong>.</p>
<p style="margin:0 0 16px"><a href="{{appUrl}}/dashboard/family/applications" style="display:inline-block;background:#0f766e;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:600">Review the application</a></p>`,
    },
  ];
  for (const template of templates) {
    await prisma.emailTemplate.upsert({
      where: { key: template.key },
      update: {},
      create: { ...template, isActive: true },
    });
  }

  // Admin audit trail ------------------------------------------------------
  await prisma.adminAuditLog
    .create({
      data: {
        actorId: admin.id,
        action: "SEED_DATABASE",
        entityType: "System",
        metadata: JSON.stringify({ seededAt: new Date().toISOString() }),
      },
    })
    .catch(() => undefined);

  // A little randomness is fine in seed data, but log a stable summary.
  const counts = {
    users: await prisma.user.count(),
    caregivers: await prisma.caregiverProfile.count(),
    jobs: await prisma.careJob.count(),
    applications: await prisma.jobApplication.count(),
    reviews: await prisma.review.count(),
    categories: await prisma.careCategory.count(),
  };
  console.log("Seed complete:", counts);
  console.log(`Demo password for every seeded account: ${PASSWORD}`);
  console.log("Admin: admin@carenest.dev · Family: sarah@carenest.dev · Caregiver: amelia@carenest.dev");
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

void crypto;
