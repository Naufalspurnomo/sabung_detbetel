import { DebateRoom } from "@/components/DebateRoom";
import { getDebate } from "@/lib/matchup-store";

type MatchupRoomPageProps = {
  params: {
    id: string;
  };
};

export default function MatchupRoomPage({ params }: MatchupRoomPageProps) {
  const debate = getDebate(params.id);

  return (
    <main className="container-shell py-6 sm:py-10">
      <div className="mb-5 sm:mb-7">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 sm:text-sm">
          Ruang debat
        </p>
        <h1 className="mt-2 text-2xl font-black text-white sm:text-3xl lg:text-4xl">
          Arena wasit AI
        </h1>
      </div>
      <DebateRoom debateId={params.id} initialDebate={debate} />
    </main>
  );
}
