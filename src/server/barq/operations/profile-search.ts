import "server-only";

import type { FeedFilters, FeedMode, ProfileSearchData } from "@/domain/barq/types";
import { toProfileSearchVariables } from "@/domain/barq/filters";
import { barqGraphQL } from "../http";
import { OVERVIEW_PROFILE_FRAGMENT } from "./fragments";

export const PROFILE_SEARCH_QUERY = `
query ProfileSearch(
  $isAd: Boolean = false
  $filters: ProfileSearchFiltersInput! = {}
  $cursor: String = ""
  $limit: Int = 30
) {
  profileSearch(
    filters: $filters
    isAd: $isAd
    cursor: $cursor
    limit: $limit
    sort: distance
  ) {
    ...OverviewProfileFragment
    ...ProfilePrimaryImagesFragment
  }
}

${OVERVIEW_PROFILE_FRAGMENT}
`;

export function profileSearch({
  token,
  mode,
  filters,
  cursor,
  limit,
}: {
  token: string;
  mode: FeedMode;
  filters: FeedFilters;
  cursor?: string;
  limit?: number;
}): Promise<ProfileSearchData> {
  const variables = toProfileSearchVariables({ mode, filters, cursor, limit });

  return barqGraphQL<ProfileSearchData, typeof variables>({
    token,
    operationName: "ProfileSearch",
    query: PROFILE_SEARCH_QUERY,
    variables,
  });
}
