import {
  DEFAULT_PROFILE_LIMIT,
  type OverviewProfile,
} from "@/domain/barq/types";
import {
  feedCacheKey,
  nextCursor,
  parseFeedFilters,
  parseFeedMode,
  type SearchParamRecord,
} from "@/domain/barq/filters";
import { toClientSafeMessage } from "@/server/barq/errors";
import { profileSearch } from "@/server/barq/operations";
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
  const mode = parseFeedMode(params);
  const filters = parseFeedFilters(params);
  const session = await requireSession();
  const cacheKey = feedCacheKey(session.viewerId, mode, filters).join(":");

  let profiles: OverviewProfile[] = [];
  let error: string | null = null;

  try {
    const data = await profileSearch({
      token: session.token,
      mode,
      filters,
      cursor: "",
      limit: DEFAULT_PROFILE_LIMIT,
    });
    profiles = data.profileSearch;
  } catch (fetchError) {
    await redirectToLoginOnAuthFailure(fetchError);
    error = toClientSafeMessage(fetchError);
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Profiles</h1>
        <p className="text-sm text-muted-foreground">
          {mode.toUpperCase()} discovery with URL-owned filters.
        </p>
      </div>

      <FeedFiltersForm filters={filters} mode={mode} />

      {error ? (
        <section className="rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
          {error}
        </section>
      ) : (
        <FeedClient
          key={cacheKey}
          filters={filters}
          initialCursor={nextCursor("", profiles.length)}
          initialHasMore={profiles.length >= DEFAULT_PROFILE_LIMIT}
          initialProfiles={profiles}
          mode={mode}
        />
      )}
    </main>
  );
}
