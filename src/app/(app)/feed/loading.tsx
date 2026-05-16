export default function FeedLoading() {
  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6">
      <div className="h-40 animate-pulse rounded-xl bg-zinc-200" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div className="h-80 animate-pulse rounded-xl bg-zinc-200" key={index} />
        ))}
      </div>
    </main>
  );
}
