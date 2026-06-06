import { tierColorClass, tierPercent } from "@/lib/tiering";

type TierMeterProps = {
  tier: string;
};

export function TierMeter({ tier }: TierMeterProps) {
  const percent = tierPercent(tier);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
          Meter tier
        </span>
        <span className="rounded-md border border-white/10 bg-white/10 px-2 py-1 text-xs font-black text-white">
          {tier}
        </span>
      </div>
      <div className="relative h-3 rounded-full bg-gradient-to-r from-slate-600 via-emerald-500 via-sky-500 to-amber-300">
        <span
          className={`absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white ${tierColorClass(
            tier
          )}`}
          style={{ left: `${percent}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
        <span>9-C</span>
        <span>5-B</span>
        <span>3-A</span>
        <span>1-A</span>
      </div>
    </div>
  );
}
