import { Suspense } from "react";
import { Mail, MessageSquare, ShieldCheck } from "lucide-react";
import { ContactForm } from "./contact-form";
import { Section } from "@/components/marketing/section";
import { Skeleton } from "@/components/ui/feedback";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Contact us",
  description:
    "Contact the CareNest team about your account, safety concerns, billing, press enquiries or anything else.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <section className="border-b border-border/60 bg-sand-50">
        <div className="container-page py-12 sm:py-16">
          <p className="eyebrow">Contact</p>
          <h1 className="display mt-2 text-4xl leading-tight sm:text-5xl">We are here to help</h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-ink-500">
            Send us a message and a real person on the CareNest team will reply. For urgent safety
            issues, call your local emergency number first.
          </p>
        </div>
      </section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-border/70 bg-white p-6 shadow-soft sm:p-8">
            <Suspense fallback={<Skeleton className="h-96 w-full" />}>
              <ContactForm />
            </Suspense>
          </div>
          <aside className="space-y-4">
            {[
              { icon: Mail, title: "Email", body: "support@carenest.example — replies within one business day." },
              { icon: MessageSquare, title: "Existing members", body: "Sign in and message our support team from your dashboard for faster help." },
              { icon: ShieldCheck, title: "Safety reports", body: "Report a profile, job or message from its page. Safety reports are prioritised." },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-2xl border border-border/70 bg-sand-50 p-5">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold">{item.title}</p>
                  </div>
                  <p className="mt-2 text-[13px] leading-6 text-ink-500">{item.body}</p>
                </div>
              );
            })}
            <div className="rounded-2xl border border-border/70 bg-white p-5 text-[12px] leading-6 text-muted-foreground">
              CareNest is a marketplace. We do not employ caregivers and cannot guarantee their
              conduct. Always interview, check references and follow our safety guidance.
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
