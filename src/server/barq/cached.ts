import "server-only";

import { cache } from "react";
import type { FeedFilters, FeedMode } from "@/domain/barq/types";
import { normalizeFeedFilters } from "@/domain/barq/filters";
import { profileSearch, user } from "./operations";

export const getViewerUser = cache((token: string) => user(token));

export const preloadViewerUser = (token: string) => {
  void getViewerUser(token);
};

export const getProfileSearchPage = cache(
  (
    token: string,
    mode: FeedMode,
    filtersJson: string,
    cursor: string,
    limit: number,
  ) =>
    profileSearch({
      token,
      mode,
      filters: JSON.parse(filtersJson) as FeedFilters,
      cursor,
      limit,
    }),
);

export function stableFeedFiltersJson(filters: FeedFilters): string {
  return JSON.stringify(normalizeFeedFilters(filters));
}
