import "server-only";

import { createHash } from "node:crypto";
import { cache } from "react";
import { clampProfileLimit, normalizeFeedFilters } from "@/domain/barq/filters";
import type {
  FeatureFlagsData,
  FeedFilters,
  FeedMode,
  PlacesData,
  ProfileDetailData,
  ProfileSearchData,
  UserData,
} from "@/domain/barq/types";
import {
  featureFlags,
  places,
  profileDetail,
  profileSearch,
  user,
} from "./operations";

const VIEWER_TTL_MS = 60_000;
const FEED_TTL_MS = 30_000;
const PROFILE_TTL_MS = 60_000;
const PLACES_TTL_MS = 5 * 60_000;
const FEATURE_FLAGS_TTL_MS = 5 * 60_000;

type CacheEntry<T> = {
  expiresAt: number;
  value: Promise<T>;
};

const viewerCache = new Map<string, CacheEntry<UserData>>();
const feedCache = new Map<string, CacheEntry<ProfileSearchData>>();
const profileCache = new Map<string, CacheEntry<ProfileDetailData>>();
const placesCache = new Map<string, CacheEntry<PlacesData>>();
const featureFlagsCache = new Map<string, CacheEntry<FeatureFlagsData>>();

export const getViewerUser = cache((token: string) =>
  getCachedRead(viewerCache, tokenPrefix(token), VIEWER_TTL_MS, () =>
    user(token),
  ),
);

export const getProfileSearchPage = cache(
  (
    token: string,
    mode: FeedMode,
    filters: FeedFilters,
    cursor: string,
    limit: number,
  ) =>
    getCachedRead(
      feedCache,
      [
        tokenPrefix(token),
        "ProfileSearch",
        mode,
        JSON.stringify(normalizeFeedFilters(filters)),
        cursor,
        String(clampProfileLimit(limit)),
      ].join(":"),
      FEED_TTL_MS,
      () =>
        profileSearch({
          token,
          mode,
          filters,
          cursor,
          limit,
        }),
    ),
);

export const getProfileDetail = cache((token: string, uuid: string) =>
  getCachedRead(
    profileCache,
    [tokenPrefix(token), "ProfileDetail", uuid].join(":"),
    PROFILE_TTL_MS,
    () => profileDetail(token, { uuid }),
  ),
);

export const getPlaces = cache((token: string, query: string) =>
  getCachedRead(
    placesCache,
    [tokenPrefix(token), "Places", query.trim().toLowerCase()].join(":"),
    PLACES_TTL_MS,
    () => places(token, { query }),
  ),
);

export const getFeatureFlags = cache((token: string) =>
  getCachedRead(
    featureFlagsCache,
    [tokenPrefix(token), "FeatureFlags"].join(":"),
    FEATURE_FLAGS_TTL_MS,
    () => featureFlags(token),
  ),
);

export function clearBarqReadCacheForToken(token: string) {
  const prefix = tokenPrefix(token);

  deleteEntriesWithPrefix(viewerCache, prefix);
  deleteEntriesWithPrefix(feedCache, prefix);
  deleteEntriesWithPrefix(profileCache, prefix);
  deleteEntriesWithPrefix(placesCache, prefix);
  deleteEntriesWithPrefix(featureFlagsCache, prefix);
}

function getCachedRead<T>(
  store: Map<string, CacheEntry<T>>,
  key: string,
  ttlMs: number,
  load: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const cached = store.get(key);

  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const value = load();
  store.set(key, {
    expiresAt: now + ttlMs,
    value,
  });

  value.catch(() => {
    if (store.get(key)?.value === value) {
      store.delete(key);
    }
  });

  return value;
}

function deleteEntriesWithPrefix<T>(
  store: Map<string, CacheEntry<T>>,
  prefix: string,
) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key);
    }
  }
}

function tokenPrefix(token: string): string {
  return createHash("sha256").update(token).digest("base64url").slice(0, 32);
}
