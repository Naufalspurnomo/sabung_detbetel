import { CharacterSearch } from "@/components/CharacterSearch";

export default function SearchPage() {
  return (
    <main className="container-shell py-10">
      <div className="mb-7">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
          Data karakter
        </p>
        <h1 className="mt-2 text-4xl font-black text-white">Cari di VS Wiki</h1>
        <p className="mt-3 max-w-2xl text-slate-400">
          Cari profil, lihat stat terstruktur, lalu pakai langsung sebagai bahan
          debat.
        </p>
      </div>
      <CharacterSearch />
    </main>
  );
}
