import Link from "next/link";
import { AbilityTag } from "./AbilityTag";
import { StatBar } from "./StatBar";
import { TierMeter } from "./TierMeter";
import type { CharacterProfile } from "@/lib/types";
import { tierPercent } from "@/lib/tiering";

type CharacterCardProps = {
  character: CharacterProfile;
  side?: "red" | "blue" | "neutral";
  compact?: boolean;
};

export function CharacterCard({
  character,
  side = "neutral",
  compact = false
}: CharacterCardProps) {
  const border =
    side === "red"
      ? "border-p1-500/35"
      : side === "blue"
        ? "border-p2-500/35"
        : "border-white/10";
  const image = character.imageUrl
    ? `/api/images/proxy?url=${encodeURIComponent(character.imageUrl)}`
    : undefined;

  return (
    <article className={`surface overflow-hidden rounded-lg ${border}`}>
      <div className="flex gap-3 p-3 sm:gap-4 sm:p-4">
        <div className="grid aspect-[4/5] w-20 shrink-0 place-items-center overflow-hidden rounded-md border border-white/10 bg-slate-900 sm:w-28 lg:w-32">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={character.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xl font-black text-slate-600 sm:text-2xl">VS</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 sm:text-xs">
                {character.series}
              </p>
              <h3 className="mt-0.5 truncate text-base font-black text-white sm:mt-1 sm:text-lg lg:text-xl">
                {character.name}
              </h3>
            </div>
            <span className="shrink-0 rounded-md border border-white/10 bg-white/10 px-2 py-0.5 text-xs font-black text-white sm:px-2.5 sm:py-1 sm:text-sm">
              {character.tier}
            </span>
          </div>

          {!compact && (
            <div className="mt-3 space-y-2.5 sm:mt-4 sm:space-y-3">
              <StatBar
                label="Attack Potency"
                value={character.attackPotency}
                tone={side === "neutral" ? "neutral" : side}
                percent={tierPercent(character.tier)}
              />
              <StatBar
                label="Speed"
                value={character.speed}
                tone={side === "neutral" ? "neutral" : side}
                percent={64}
              />
              <TierMeter tier={character.tier} />
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {character.abilities.slice(0, 6).map((ability) => (
                  <AbilityTag key={ability} ability={ability} />
                ))}
              </div>
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2 sm:mt-4">
            <Link
              href={`/profile/${encodeURIComponent(character.pageTitle)}`}
              className="rounded-md bg-white px-3 py-2 text-xs font-black text-slate-950 transition hover:bg-slate-200 active:scale-95 sm:text-sm"
            >
              Buka data
            </Link>
            <a
              href={character.wikiUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-white/10 px-3 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/10 active:scale-95 sm:text-sm"
            >
              Sumber wiki
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
