"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_PROFILE_LIMIT,
  type FeedPageResponse,
  type FeedFilters,
  type FeedMode,
  type OverviewProfile,
} from "@/domain/barq/types";
import { filtersToSearchParams } from "@/domain/barq/filters";
import { isRecord } from "@/lib/type-guards";
import { ProfileCard } from "./profile-card";

const feedPageCache = new Map<string, FeedPageResponse>();
const MAX_FEED_PAGE_CACHE_SIZE = 48;

export function FeedClient({
  initialProfiles,
  initialCursor,
  initialHasMore,
  mode,
  filters,
  viewerId,
}: {
  initialProfiles: OverviewProfile[];
  initialCursor: string;
  initialHasMore: boolean;
  mode: FeedMode;
  filters: FeedFilters;
  viewerId?: number;
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

    const params = filtersToSearchParams(mode, filters, {
      includeDefaultMode: true,
      includeImplicitLocation: true,
    });
    params.set("cursor", cursor);
    params.set("limit", String(DEFAULT_PROFILE_LIMIT));

    const pageUrl = `/api/feed?${params.toString()}`;
    const cacheKey = viewerId === undefined ? null : `${viewerId}:${pageUrl}`;

    try {
      let page = cacheKey ? feedPageCache.get(cacheKey) : undefined;

      if (!page) {
        const response = await fetch(pageUrl);

        if (!response.ok) {
          throw new Error("Could not load more profiles.");
        }

        const data: unknown = await response.json();

        if (!isFeedPageResponse(data)) {
          throw new Error("Could not load more profiles.");
        }

        page = data;

        if (cacheKey) {
          feedPageCache.set(cacheKey, page);

          if (feedPageCache.size > MAX_FEED_PAGE_CACHE_SIZE) {
            const oldestKey = feedPageCache.keys().next().value;
            if (typeof oldestKey === "string") {
              feedPageCache.delete(oldestKey);
            }
          }
        }
      }

      setProfiles((current) => mergeProfiles(current, page.profiles));
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load more profiles.",
      );
    } finally {
      setLoading(false);
    }
  }, [cursor, filters, hasMore, loading, mode, viewerId]);

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
      <section className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-card-foreground">
        <h2 className="text-lg font-semibold">No profiles found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Adjust filters or switch feed mode.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {profiles.map((profile, index) => (
          <ProfileCard
            key={profile.uuid}
            mode={mode}
            prefetch={index < 12}
            profile={profile}
          />
        ))}
      </div>

      <div
        ref={sentinelRef}
        className="flex min-h-16 items-center justify-center"
      >
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading more...</p>
        ) : null}
        {!hasMore && !loading ? (
          <p className="text-sm text-muted-foreground">End of feed</p>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
    </section>
  );
}

function mergeProfiles(
  current: OverviewProfile[],
  next: OverviewProfile[],
): OverviewProfile[] {
  const seen = new Set(current.map((profile) => profile.uuid));
  return [...current, ...next.filter((profile) => !seen.has(profile.uuid))];
}

function isFeedPageResponse(value: unknown): value is FeedPageResponse {
  return (
    isRecord(value) &&
    Array.isArray(value.profiles) &&
    typeof value.cursor === "string" &&
    typeof value.hasMore === "boolean"
  );
}
