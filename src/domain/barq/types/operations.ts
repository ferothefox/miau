import type { FeatureFlag } from "./feature-flags";
import type { Place } from "./common";
import type { OverviewProfile, ProfileDetail } from "./profile";
import type { ViewerUser } from "./user";

export type FeatureFlagsData = {
  featureFlags: FeatureFlag[];
};

export type UserData = {
  user: ViewerUser;
};

export type PlacesVariables = {
  query: string;
};

export type PlacesData = {
  places: Place[];
};

export type ProfileSearchData = {
  profileSearch: OverviewProfile[];
};

export type ProfileDetailVariables = {
  uuid: string;
};

export type ProfileDetailData = {
  profile: ProfileDetail | null;
};

export type LikeProfileVariables = {
  uuid: string;
};

export type LikeProfileData = {
  likeProfile: "liked" | string;
};

export type UnlikeProfileData = {
  unlikeProfile: null;
};
