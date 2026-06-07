import { CharacterSearch } from "@/components/CharacterSearch";

export default function SearchPage() {
  return (
    <main className="container-shell py-6 sm:py-10">
      <div className="mb-5 sm:mb-7">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 sm:text-sm">
          Data karakter
        </p>
        <h1 className="mt-2 text-2xl font-black text-white sm:text-3xl lg:text-4xl">
          Cari di VS Wiki
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 sm:mt-3 sm:text-base">
          Cari profil, lihat stat terstruktur, lalu pakai langsung sebagai bahan
          debat.
        </p>
      </div>
      <CharacterSearch />
    </main>
  );
}
