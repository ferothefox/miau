import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DEFAULT_PROFILE_LIMIT,
  type FeedFilters,
  type FeedMode,
  type OverviewProfile,
} from "@/domain/barq/types";
import {
  applyDefaultFeedLocation,
  feedCacheKey,
  nextCursor,
  parseFeedFilters,
  parseFeedMode,
  shouldUseDefaultFeedLocation,
  type SearchParamRecord,
} from "@/domain/barq/filters";
import { normalizeProfileDetail } from "@/domain/barq/normalize";
import { toClientSafeMessage } from "@/server/barq/errors";
import { getProfileSearchPage, getViewerUser } from "@/server/barq/cached";
import { redirectToLoginOnAuthFailure } from "@/server/barq/redirects";
import { requireSession } from "@/server/session";
import { FeedClient } from "@/features/feed/feed-client";
import { FeedFiltersForm } from "@/features/feed/feed-filters";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamRecord>;
}) {
  const params = await searchParams;
  const session = await requireSession();
  const mode = parseFeedMode(params);
  const parsedFilters = parseFeedFilters(params);
  const useDefaultLocation = shouldUseDefaultFeedLocation(params);

  const viewer = await getViewerUser(session.token).catch(
    redirectToLoginOnAuthFailure,
  );
  const viewerProfile = normalizeProfileDetail(viewer.user.profile);
  const filters = applyDefaultFeedLocation(
    parsedFilters,
    viewerProfile.location,
    { enabled: useDefaultLocation },
  );
  const gridKey = feedCacheKey(session.viewerId, mode, filters).join(":");

  return (
    <main className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6">
      <FeedFiltersForm
        filters={filters}
        isDefaultLocationImplicit={
          useDefaultLocation && Boolean(filters.location)
        }
        mode={mode}
        viewerName={viewerProfile.username ?? viewerProfile.displayName}
      />

      <Suspense fallback={<FeedGridFallback />} key={gridKey}>
        <FeedGrid
          filters={filters}
          mode={mode}
          token={session.token}
          viewerId={session.viewerId}
        />
      </Suspense>
    </main>
  );
}

async function FeedGrid({
  filters,
  mode,
  token,
  viewerId,
}: {
  filters: FeedFilters;
  mode: FeedMode;
  token: string;
  viewerId?: number;
}) {
  const cacheKey = feedCacheKey(viewerId, mode, filters).join(":");

  let profiles: OverviewProfile[] = [];
  let error: string | null = null;

  try {
    const data = await getProfileSearchPage(
      token,
      mode,
      filters,
      "",
      DEFAULT_PROFILE_LIMIT,
    );
    profiles = data.profileSearch;
  } catch (fetchError) {
    await redirectToLoginOnAuthFailure(fetchError);
    error = toClientSafeMessage(fetchError);
  }

  if (error) {
    return (
      <section className="rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
        {error}
      </section>
    );
  }

  return (
    <FeedClient
      key={cacheKey}
      filters={filters}
      initialCursor={nextCursor("", profiles.length)}
      initialHasMore={profiles.length >= DEFAULT_PROFILE_LIMIT}
      initialProfiles={profiles}
      mode={mode}
      viewerId={viewerId}
    />
  );
}

function FeedGridFallback() {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton className="h-80 rounded-xl" key={index} />
      ))}
    </section>
  );
}
