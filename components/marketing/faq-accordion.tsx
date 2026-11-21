export function FaqAccordion({
  faqs,
}: {
  faqs: { id: string; question: string; answer: string }[];
}) {
  if (!faqs.length) return null;
  return (
    <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border/70 bg-white">
      {faqs.map((faq) => (
        <details key={faq.id} className="group px-5 py-4 open:bg-sand-50/60">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-medium text-ink-900">
            {faq.question}
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-lg leading-none text-muted-foreground transition-transform group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-500">{faq.answer}</p>
        </details>
      ))}
    </div>
  );
}
