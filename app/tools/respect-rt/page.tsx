import { RespectThreadTool } from "./respect-thread-tool";

export default function RespectThreadPage() {
  return (
    <main className="container-shell py-10">
      <div className="mb-7">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
          Tool konten
        </p>
        <h1 className="mt-2 text-4xl font-black text-white">
          Generator Respect Thread
        </h1>
        <p className="mt-3 max-w-2xl text-slate-400">
          Ambil stat profil dan feat awal ke format markdown gaya Reddit.
        </p>
      </div>
      <RespectThreadTool />
    </main>
  );
}
