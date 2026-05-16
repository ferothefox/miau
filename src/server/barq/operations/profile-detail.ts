import "server-only";

import type {
  ProfileDetailData,
  ProfileDetailVariables,
} from "@/domain/barq/types";
import { barqGraphQL } from "../http";
import { PROFILE_DETAIL_FRAGMENTS } from "./fragments";

export const PROFILE_DETAIL_QUERY = `
query ProfileDetail($uuid: String!) {
  profile(uuid: $uuid) {
    id
    uuid
    displayName
    username
    relationType
    isAdOptIn
    isBirthday
    age
    ...ProfilePrimaryImagesFragment
    ...ProfileHeaderImagesFragment
    privacySettings {
      ...PrivacySettingsFragment
    }
    images {
      ...ProfileImageFragment
      likeCount
      hasLiked
    }
    location {
      ...ProfileLocationFragment
      distance
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
    sonas {
      ...SonaFragment
    }
    kinks {
      ...ProfileKinkFragment
    }
    groups {
      ...ProfileGroupFragment
    }
    events {
      ...ProfileEventFragment
    }
    roles
    shareHash
    __typename
  }
}

${PROFILE_DETAIL_FRAGMENTS}
`;

export function profileDetail(
  token: string,
  variables: ProfileDetailVariables,
): Promise<ProfileDetailData> {
  return barqGraphQL<ProfileDetailData, ProfileDetailVariables>({
    token,
    operationName: "ProfileDetail",
    query: PROFILE_DETAIL_QUERY,
    variables,
  });
}
