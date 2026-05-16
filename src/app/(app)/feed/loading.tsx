import { Skeleton } from "@/components/ui/skeleton";

export default function FeedLoading() {
  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6">
      <Skeleton className="h-40 rounded-xl" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton className="h-80 rounded-xl" key={index} />
        ))}
      </div>
    </main>
  );
}
