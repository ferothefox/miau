import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DEFAULT_PROFILE_LIMIT,
  type FeedFilters,
  type FeedMode,
  type OverviewProfile,
  type ProfileLocation,
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
import {
  getProfileSearchPage,
  getViewerUser,
  preloadViewerUser,
  stableFeedFiltersJson,
} from "@/server/barq/cached";
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
  const fallbackKey = [
    mode,
    stableFeedFiltersJson(parsedFilters),
    useDefaultLocation ? "viewer-location" : "explicit-location",
  ].join(":");

  preloadViewerUser(session.token);

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Profiles</h1>
        <p className="text-sm text-muted-foreground">
          {mode.toUpperCase()} discovery with URL-owned filters.
        </p>
      </div>

      <Suspense fallback={<FeedFiltersFallback />}>
        <FeedFilters
          mode={mode}
          parsedFilters={parsedFilters}
          token={session.token}
          useDefaultLocation={useDefaultLocation}
        />
      </Suspense>

      <Suspense fallback={<FeedGridFallback />} key={fallbackKey}>
        <FeedGrid
          mode={mode}
          parsedFilters={parsedFilters}
          token={session.token}
          useDefaultLocation={useDefaultLocation}
          viewerId={session.viewerId}
        />
      </Suspense>
    </main>
  );
}

async function FeedFilters({
  mode,
  parsedFilters,
  token,
  useDefaultLocation,
}: {
  mode: FeedMode;
  parsedFilters: FeedFilters;
  token: string;
  useDefaultLocation: boolean;
}) {
  const location = useDefaultLocation
    ? await getViewerLocation(token).catch(redirectToLoginOnAuthFailure)
    : null;
  const filters = applyDefaultFeedLocation(parsedFilters, location, {
    enabled: useDefaultLocation,
  });

  return (
    <FeedFiltersForm
      filters={filters}
      isDefaultLocationImplicit={
        useDefaultLocation && Boolean(filters.location)
      }
      key={[
        mode,
        stableFeedFiltersJson(parsedFilters),
        useDefaultLocation ? "implicit" : "explicit",
      ].join(":")}
      mode={mode}
    />
  );
}

async function FeedGrid({
  mode,
  parsedFilters,
  token,
  useDefaultLocation,
  viewerId,
}: {
  mode: FeedMode;
  parsedFilters: FeedFilters;
  token: string;
  useDefaultLocation: boolean;
  viewerId?: number;
}) {
  const location = useDefaultLocation
    ? await getViewerLocation(token).catch(redirectToLoginOnAuthFailure)
    : null;
  const filters = applyDefaultFeedLocation(parsedFilters, location, {
    enabled: useDefaultLocation,
  });
  const filtersJson = stableFeedFiltersJson(filters);
  const cacheKey = feedCacheKey(viewerId, mode, filters).join(":");

  let profiles: OverviewProfile[] = [];
  let error: string | null = null;

  try {
    const data = await getProfileSearchPage(
      token,
      mode,
      filtersJson,
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
    />
  );
}

async function getViewerLocation(
  token: string,
): Promise<ProfileLocation | null> {
  const viewer = await getViewerUser(token);
  return normalizeProfileDetail(viewer.user.profile).location;
}

function FeedFiltersFallback() {
  return (
    <div className="grid gap-6">
      <div className="flex gap-2">
        <Skeleton className="h-9 w-16 rounded-md" />
        <Skeleton className="h-9 w-16 rounded-md" />
      </div>
      <Skeleton className="h-40 rounded-lg" />
    </div>
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
