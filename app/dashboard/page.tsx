import Link from "next/link";

export default function DashboardPage() {
  return (
    <main className="container-shell py-10">
      <div className="mb-7">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
          Panel user
        </p>
        <h1 className="mt-2 text-4xl font-black text-white">Panel tamu</h1>
        <p className="mt-3 max-w-2xl text-slate-400">
          Login disiapkan untuk fase berikutnya. Untuk MVP, flow tamu dibuka
          supaya fitur wasit bisa dites cepat.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Jatah verdict harian", "3"],
          ["Debat tersimpan", "0"],
          ["Akurasi argumen", "0%"]
        ].map(([label, value]) => (
          <article key={label} className="surface rounded-lg p-5">
            <p className="text-sm font-bold text-slate-500">{label}</p>
            <p className="mt-2 text-4xl font-black text-white">{value}</p>
          </article>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/matchup"
          className="rounded-md bg-white px-4 py-2 text-sm font-black text-slate-950 hover:bg-slate-200"
        >
          Matchup baru
        </Link>
        <Link
          href="/tools/respect-rt"
          className="rounded-md border border-white/10 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-white/10"
        >
          Buat RT
        </Link>
      </div>
    </main>
  );
}
