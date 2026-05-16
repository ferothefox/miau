import type { ProfileDetail } from "./profile";

export type BlockedContent = {
  profiles: Array<{
    uuid: string;
    displayName: string;
    __typename: "Profile";
  }>;
  groups: Array<{
    uuid: string;
    displayName: string;
    __typename: "Group";
  }>;
  __typename: "BlockedContent";
};

export type ActivitySummary = {
  unreadActivitiesCount: number;
  chatActivity: {
    unreadMessageCount: number;
    __typename: string;
  } | null;
  __typename: "ActivitySummary";
};

export type ViewerUser = {
  profile: ProfileDetail;
  blockedContent: BlockedContent;
  isAdOptIn: boolean;
  isExplicitContentOptIn: boolean;
  isHardContentOptIn: boolean;
  isOnboarded: boolean;
  likeCount: number;
  mutualCount: number;
  activitySummary: ActivitySummary;
  __typename: "User";
};
