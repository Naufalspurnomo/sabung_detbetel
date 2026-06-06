type StatBarProps = {
  label: string;
  value: string;
  tone?: "red" | "blue" | "neutral";
  percent?: number;
};

export function StatBar({
  label,
  value,
  tone = "neutral",
  percent = 58
}: StatBarProps) {
  const color =
    tone === "red"
      ? "bg-p1-500"
      : tone === "blue"
        ? "bg-p2-500"
        : "bg-slate-400";

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
          {label}
        </span>
        <span className="max-w-[68%] text-right text-sm font-semibold text-slate-100">
          {value}
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-800">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${Math.max(4, Math.min(percent, 100))}%` }}
        />
      </div>
    </div>
  );
}
