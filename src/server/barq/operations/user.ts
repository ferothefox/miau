import "server-only";

import type { UserData } from "@/domain/barq/types";
import { barqGraphQL } from "../http";
import { BLOCKED_CONTENT_FRAGMENT, PROFILE_DETAIL_FRAGMENTS } from "./fragments";

export const USER_QUERY = `
query User {
  user {
    profile {
      id
      uuid
      displayName
      username
      relationType
      roles
      age
      isAdOptIn
      isBirthday
      ...ProfilePrimaryImagesFragment
      ...ProfileHeaderImagesFragment
      privacySettings {
        ...PrivacySettingsFragment
      }
      location {
        ...ProfileLocationFragment
        precision
      }
      images {
        ...ProfileImageFragment
      }
      bio {
        ...ProfileBioFragment
      }
      socialAccounts {
        ...ProfileSocialAccountFragment
      }
      bioAd {
        ...ProfileBioAdFragment
      }
      kinks(type: all) {
        ...ProfileKinkFragment
      }
      sonas {
        ...SonaFragment
      }
      groups {
        ...ProfileGroupFragment
      }
      events {
        ...ProfileEventFragment
      }
      shareHash
      __typename
    }
    blockedContent {
      ...BlockedContentFragment
    }
    isAdOptIn
    isExplicitContentOptIn
    isHardContentOptIn
    isOnboarded
    likeCount
    mutualCount
    activitySummary {
      unreadActivitiesCount
      chatActivity {
        unreadMessageCount
        __typename
      }
      __typename
    }
    __typename
  }
}

${PROFILE_DETAIL_FRAGMENTS}
${BLOCKED_CONTENT_FRAGMENT}
`;

export function user(token: string): Promise<UserData> {
  return barqGraphQL<UserData, Record<string, never>>({
    token,
    operationName: "User",
    query: USER_QUERY,
    variables: {},
  });
}
