import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <Skeleton className="h-64 rounded-xl" />
      <div className="mt-6 grid gap-4 md:grid-cols-[280px_1fr]">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </main>
  );
}
