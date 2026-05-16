import type { OverviewProfile } from "./profile";

export type FeedMode = "sfw" | "nsfw";

export type FeedLocationScope = "distance" | "city" | "region" | "country";

export type FeedLocationFilter = {
  latitude: number;
  longitude: number;
  type: FeedLocationScope;
  distanceKm?: number;
};

export type FeedFilters = {
  displayName?: string;
  location?: FeedLocationFilter;
  locationLabel?: string;
  radius?: "infinite" | "100mi" | "250mi";
  requireProfileImage?: boolean;
  ageMin?: number;
  ageMax?: number;
  genders?: string[];
  relationshipStatus?: string[];
  sexPositions?: string[];
};

export type ProfileSearchVariables = {
  isAd: boolean;
  filters: {
    displayName?: string;
    location?: {
      latitude: number;
      longitude: number;
      type: FeedLocationScope;
      distance?: number;
    };
    requireProfileImage?: boolean;
    age?: {
      min?: number;
      max?: number;
    };
    genders?: string[];
    relationshipStatus?: string[];
    sexPositions?: string[];
  };
  cursor: string;
  limit: number;
};

export type FeedPageResponse = {
  profiles: OverviewProfile[];
  cursor: string;
  hasMore: boolean;
};

export const DEFAULT_PROFILE_LIMIT = 60;
export const MAX_PROFILE_LIMIT = 99;
