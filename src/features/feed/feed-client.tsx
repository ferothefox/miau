"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_PROFILE_LIMIT, type FeedFilters, type FeedMode, type OverviewProfile } from "@/domain/barq/types";
import { ProfileCard } from "./profile-card";
import type { FeedPagePayload, FeedPageResponse } from "./types";

export function FeedClient({
  initialProfiles,
  initialCursor,
  initialHasMore,
  mode,
  filters,
}: {
  initialProfiles: OverviewProfile[];
  initialCursor: string;
  initialHasMore: boolean;
  mode: FeedMode;
  filters: FeedFilters;
}) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [cursor, setCursor] = useState(initialCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) {
      return;
    }

    setLoading(true);
    setError(null);

    const payload: FeedPagePayload = {
      mode,
      filters,
      cursor,
      limit: DEFAULT_PROFILE_LIMIT,
    };

    try {
      const response = await fetch("/api/feed", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Could not load more profiles.");
      }

      const page = (await response.json()) as FeedPageResponse;
      setProfiles((current) => mergeProfiles(current, page.profiles));
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    } catch (loadError) {
      setError((loadError as Error).message);
    } finally {
      setLoading(false);
    }
  }, [cursor, filters, hasMore, loading, mode]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMore();
        }
      },
      { rootMargin: "700px 0px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  if (profiles.length === 0) {
    return (
      <section className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
        <h2 className="text-lg font-semibold text-zinc-950">No profiles found</h2>
        <p className="mt-2 text-sm text-zinc-500">Adjust filters or switch feed mode.</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {profiles.map((profile) => (
          <ProfileCard key={profile.uuid} mode={mode} profile={profile} />
        ))}
      </div>

      <div ref={sentinelRef} className="flex min-h-16 items-center justify-center">
        {loading ? <p className="text-sm text-zinc-500">Loading more...</p> : null}
        {!hasMore && !loading ? (
          <p className="text-sm text-zinc-500">End of feed</p>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
    </section>
  );
}

function mergeProfiles(current: OverviewProfile[], next: OverviewProfile[]): OverviewProfile[] {
  const seen = new Set(current.map((profile) => profile.uuid));
  return [...current, ...next.filter((profile) => !seen.has(profile.uuid))];
}
