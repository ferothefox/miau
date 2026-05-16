export default function ProfileLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="h-64 animate-pulse rounded-xl bg-zinc-200" />
      <div className="mt-6 grid gap-4 md:grid-cols-[280px_1fr]">
        <div className="h-80 animate-pulse rounded-xl bg-zinc-200" />
        <div className="h-80 animate-pulse rounded-xl bg-zinc-200" />
      </div>
    </main>
  );
}
