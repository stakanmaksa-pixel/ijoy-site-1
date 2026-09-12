import type { groupProductSpecs } from "@/lib/productSpecs";

export function ProductSpecsAccordion({ groups }: { groups: ReturnType<typeof groupProductSpecs> }) {
  return (
    <div className="mt-5 space-y-3">
      {groups.map((group, index) => (
        <details key={group.title} open={index === 0} className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-base font-semibold text-foreground transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent sm:px-6 [&::-webkit-details-marker]:hidden">
            {group.title}
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-5 w-5 shrink-0 text-zinc-500 transition-transform group-open:rotate-180 motion-reduce:transition-none">
              <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </summary>
          <dl className="mx-5 divide-y divide-zinc-100 border-t border-zinc-100 pb-2 sm:mx-6">
            {group.entries.map(([label, value]) => (
              <div key={label} className="grid min-w-0 gap-1 py-3 text-sm leading-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-6">
                <dt className="min-w-0 text-zinc-500 [overflow-wrap:anywhere]">{label}</dt>
                <dd className="min-w-0 text-foreground [overflow-wrap:anywhere]">{value}</dd>
              </div>
            ))}
          </dl>
        </details>
      ))}
    </div>
  );
}
