import type { OverviewProfile } from "@/domain/barq/types";

export type FeedPageResponse = {
  profiles: OverviewProfile[];
  cursor: string;
  hasMore: boolean;
};
