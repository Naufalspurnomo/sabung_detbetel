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
    <main className="container-shell py-10">
      <div className="mb-7">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
          Ruang debat
        </p>
        <h1 className="mt-2 text-4xl font-black text-white">
          Arena wasit AI
        </h1>
      </div>
      <DebateRoom debateId={params.id} initialDebate={debate} />
    </main>
  );
}
