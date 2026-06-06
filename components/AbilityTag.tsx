type AbilityTagProps = {
  ability: string;
};

export function AbilityTag({ ability }: AbilityTagProps) {
  return (
    <span className="inline-flex rounded-md border border-white/10 bg-white/10 px-2.5 py-1 text-xs font-semibold text-slate-200">
      {ability}
    </span>
  );
}
