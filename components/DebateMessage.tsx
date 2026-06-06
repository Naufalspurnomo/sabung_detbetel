import type { DebateArgument } from "@/lib/types";

type DebateMessageProps = {
  argument: DebateArgument;
  side: "red" | "blue";
};

export function DebateMessage({ argument, side }: DebateMessageProps) {
  const tone =
    side === "red"
      ? "border-p1-500/30 bg-red-500/10"
      : "border-p2-500/30 bg-blue-500/10";

  return (
    <article className={`rounded-lg border p-4 ${tone}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
          {argument.characterTitle}
        </span>
        <time className="text-xs text-slate-500">
          {new Date(argument.createdAt).toLocaleTimeString()}
        </time>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-100">
        {argument.content}
      </p>
    </article>
  );
}
