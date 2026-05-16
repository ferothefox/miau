export { featureFlags, FEATURE_FLAGS_QUERY } from "./feature-flags";
export { likeProfile, LIKE_PROFILE_MUTATION } from "./like-profile";
export { places, PLACES_QUERY } from "./places";
export { profileDetail, PROFILE_DETAIL_QUERY } from "./profile-detail";
export { profileSearch, PROFILE_SEARCH_QUERY } from "./profile-search";
export { unlikeProfile, UNLIKE_PROFILE_MUTATION } from "./unlike-profile";
export { user, USER_QUERY } from "./user";

export const BARQ_OPERATIONS = {
  FeatureFlags: "FeatureFlags",
  User: "User",
  Places: "Places",
  ProfileSearch: "ProfileSearch",
  ProfileDetail: "ProfileDetail",
  LikeProfile: "LikeProfile",
  UnlikeProfile: "UnlikeProfile",
} as const;

export type BarqOperationName = keyof typeof BARQ_OPERATIONS;
