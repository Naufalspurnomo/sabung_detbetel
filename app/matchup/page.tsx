import { MatchupSetup } from "@/components/MatchupSetup";

export default function MatchupPage() {
  return (
    <main className="container-shell py-10">
      <div className="mb-7">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
          Setup debat
        </p>
        <h1 className="mt-2 text-4xl font-black text-white">Buat matchup</h1>
        <p className="mt-3 max-w-2xl text-slate-400">
          Pilih dua judul halaman VS Wiki, masukkan argumen, lalu jalankan wasit
          AI untuk verdict bersumber.
        </p>
      </div>
      <MatchupSetup />
    </main>
  );
}
