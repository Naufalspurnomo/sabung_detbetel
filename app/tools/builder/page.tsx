import { CharacterBuilderTool } from "./character-builder-tool";

export default function BuilderPage() {
  return (
    <main className="container-shell py-10">
      <div className="mb-7">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
          Tool konten
        </p>
        <h1 className="mt-2 text-4xl font-black text-white">
          Builder karakter OC
        </h1>
        <p className="mt-3 max-w-2xl text-slate-400">
          Buat draft gaya VSB yang konservatif dari catatan karakter buatan user.
        </p>
      </div>
      <CharacterBuilderTool />
    </main>
  );
}
