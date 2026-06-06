import type { Feat } from "@/lib/types";
import { featCategoryLabel, featConfidenceLabel } from "@/lib/ui-labels";

type FeatCardProps = {
  feat: Feat;
};

export function FeatCard({ feat }: FeatCardProps) {
  return (
    <article className="rounded-lg border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-md border border-white/10 bg-white/10 px-2 py-1 text-xs font-black uppercase tracking-[0.12em] text-slate-300">
          {featCategoryLabel(feat.category)}
        </span>
        <span className="text-xs font-semibold text-slate-500">
          keyakinan {featConfidenceLabel(feat.confidence)}
        </span>
      </div>
      <h3 className="mt-3 text-base font-black text-white">{feat.title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">{feat.description}</p>
      <a
        href={feat.source.url}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex text-sm font-bold text-sky-300 hover:text-sky-200"
      >
        {feat.source.label}
      </a>
    </article>
  );
}
