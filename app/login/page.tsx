export default function LoginPage() {
  return (
    <main className="container-shell grid min-h-[calc(100vh-64px)] place-items-center py-10">
      <section className="surface w-full max-w-md rounded-lg p-6">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
          Login
        </p>
        <h1 className="mt-2 text-3xl font-black text-white">
          Login menyusul
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          OAuth Google, Discord, dan GitHub disiapkan untuk fase berikutnya.
          MVP saat ini berjalan sebagai tamu agar wasit bisa dites langsung.
        </p>
        <div className="mt-5 grid gap-3">
          {["Google", "Discord", "GitHub"].map((provider) => (
            <button
              key={provider}
              type="button"
              disabled
              className="min-h-11 rounded-md border border-white/10 bg-white/5 text-sm font-black text-slate-500"
            >
              Lanjut dengan {provider}
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
