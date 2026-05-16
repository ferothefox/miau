export const UPLOADED_IMAGE_FRAGMENT = `
fragment UploadedImageFragment on UploadedImage {
  uuid
  contentRating
  width
  height
  blurHash
  __typename
}
`;

export const PLACE_FRAGMENT = `
fragment PlaceFragment on Place {
  id
  place
  region
  country
  countryCode
  longitude
  latitude
  __typename
}
`;

export const PROFILE_PRIMARY_IMAGES_FRAGMENT = `
${UPLOADED_IMAGE_FRAGMENT}

fragment ProfileSafePrimaryImageFragment on Profile {
  primaryImage {
    ...UploadedImageFragment
  }
}

fragment ProfileExplicitPrimaryImageFragment on Profile {
  primaryImageAd {
    ...UploadedImageFragment
  }
}

fragment ProfilePrimaryImagesFragment on Profile {
  ...ProfileSafePrimaryImageFragment
  ...ProfileExplicitPrimaryImageFragment
}
`;

export const PROFILE_HEADER_IMAGES_FRAGMENT = `
fragment ProfileSafeHeaderImageFragment on Profile {
  headerImage {
    ...UploadedImageFragment
  }
}

fragment ProfileExplicitHeaderImageFragment on Profile {
  headerImageAd {
    ...UploadedImageFragment
  }
}

fragment ProfileHeaderImagesFragment on Profile {
  ...ProfileSafeHeaderImageFragment
  ...ProfileExplicitHeaderImageFragment
}
`;

export const OVERVIEW_PROFILE_FRAGMENT = `
${PROFILE_PRIMARY_IMAGES_FRAGMENT}

fragment MinimalProfileFragment on Profile {
  uuid
  displayName
  ...ProfileSafePrimaryImageFragment
  __typename
}

fragment OverviewProfileFragment on Profile {
  ...MinimalProfileFragment
  username
  roles
  relationType
  location {
    distance
    type
    place {
      id
      __typename
    }
    homePlace {
      id
      __typename
    }
    __typename
  }
  __typename
}
`;

export const PROFILE_DETAIL_FRAGMENTS = `
${PROFILE_PRIMARY_IMAGES_FRAGMENT}
${PROFILE_HEADER_IMAGES_FRAGMENT}
${PLACE_FRAGMENT}

fragment PrivacySettingsFragment on PrivacySettings {
  startChat
  viewKinks
  viewAge
  viewAd
  viewProfile
  showLastOnline
  __typename
}

fragment InterestFragment on Interest {
  interest
  __typename
}

fragment ProfileBioFragment on ProfileBio {
  biography
  genders
  languages
  relationshipStatus
  sexualOrientation
  interests
  hobbies {
    ...InterestFragment
  }
  __typename
}

fragment ProfileBioAdFragment on ProfileBioAd {
  biography
  sexPositions
  behaviour
  safeSex
  canHost
  __typename
}

fragment EventFragment on Event {
  uuid
  displayName
  isAd
  eventBeginAt
  eventEndAt
  image {
    ...UploadedImageFragment
  }
  __typename
}

fragment ProfileEventFragment on ProfileEvent {
  isWaitingList
  event {
    ...EventFragment
  }
  __typename
}

fragment GroupFragment on Group {
  uuid
  displayName
  isAd
  isVerified
  image {
    ...UploadedImageFragment
  }
  __typename
}

fragment ProfileGroupFragment on ProfileGroup {
  group {
    ...GroupFragment
  }
  threadCount
  replyCount
  __typename
}

fragment ProfileImageFragment on ProfileImage {
  id
  image {
    ...UploadedImageFragment
  }
  accessPermission
  isAd
  __typename
}

fragment KinkFragment on Kink {
  id
  displayName
  categoryName
  isVerified
  isSinglePlayer
  __typename
}

fragment ProfileKinkFragment on ProfileKink {
  pleasureGive
  pleasureReceive
  kink {
    ...KinkFragment
  }
  __typename
}

fragment ProfileLocationFragment on ProfileLocation {
  type
  homePlace {
    ...PlaceFragment
  }
  place {
    ...PlaceFragment
  }
  __typename
}

fragment ProfileSocialAccountFragment on ProfileSocialAccount {
  id
  socialNetwork
  isVerified
  url
  displayName
  value
  accessPermission
  __typename
}

fragment SpeciesFragment on Species {
  id
  displayName
  __typename
}

fragment SonaImageFragment on ProfileImage {
  id
  image {
    ...UploadedImageFragment
  }
  isAd
  __typename
}

fragment SonaFragment on Sona {
  id
  displayName
  hasFursuit
  species {
    ...SpeciesFragment
  }
  images {
    ...SonaImageFragment
  }
  __typename
}
`;

export const BLOCKED_CONTENT_FRAGMENT = `
fragment BlockedContentFragment on BlockedContent {
  profiles {
    uuid
    displayName
    __typename
  }
  groups {
    uuid
    displayName
    __typename
  }
  __typename
}
`;
