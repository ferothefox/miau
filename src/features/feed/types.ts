import type { FeedFilters, FeedMode, OverviewProfile } from "@/domain/barq/types";

export type FeedPagePayload = {
  mode: FeedMode;
  filters: FeedFilters;
  cursor: string;
  limit: number;
};

export type FeedPageResponse = {
  profiles: OverviewProfile[];
  cursor: string;
  hasMore: boolean;
};
