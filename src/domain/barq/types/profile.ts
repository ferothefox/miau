import type { IDString, Place, PrivacyVisibility, RelationType, UploadedImage } from "./common";

export type ProfileLocation = {
  type: "gps" | "manual" | string;
  distance?: number | null;
  precision?: string | null;
  place: Place | null;
  homePlace: Place | null;
  __typename: "ProfileLocation";
};

export type PrivacySettings = {
  startChat: PrivacyVisibility;
  viewKinks: PrivacyVisibility;
  viewAge: PrivacyVisibility;
  viewAd: PrivacyVisibility;
  viewProfile: PrivacyVisibility;
  showLastOnline: boolean;
  __typename: "PrivacySettings";
};

export type Interest = {
  interest: string;
  __typename: "Interest";
};

export type ProfileBio = {
  biography: string | null;
  genders: string[] | null;
  languages: string[] | null;
  relationshipStatus:
    | "engaged_married"
    | "single"
    | "relationship"
    | "open_relationship"
    | "domestic_partnership"
    | "other"
    | string
    | null;
  sexualOrientation: string | null;
  interests: unknown | null;
  hobbies: Interest[] | null;
  __typename: "ProfileBio";
};

export type ProfileBioAd = {
  biography: string | null;
  sexPositions: Array<"top" | "bottom" | string> | null;
  behaviour: string[] | null;
  safeSex: string | null;
  canHost: boolean | null;
  __typename: "ProfileBioAd";
};

export type ProfileSocialAccount = {
  id: IDString;
  socialNetwork: string;
  isVerified: boolean;
  url: string | null;
  displayName: string | null;
  value: string | null;
  accessPermission: PrivacyVisibility;
  __typename: "ProfileSocialAccount";
};

export type ProfileImage = {
  id: IDString;
  image: UploadedImage | null;
  accessPermission: PrivacyVisibility;
  isAd: boolean;
  likeCount?: number;
  hasLiked?: boolean;
  __typename: "ProfileImage";
};

export type Species = {
  id: IDString;
  displayName: string;
  __typename: "Species";
};

export type SonaImage = {
  id: IDString;
  image: UploadedImage | null;
  isAd: boolean;
  __typename: "ProfileImage";
};

export type Sona = {
  id: IDString;
  displayName: string;
  hasFursuit: boolean;
  species: Species | null;
  images: SonaImage[];
  __typename: "Sona";
};

export type Kink = {
  id: IDString;
  displayName: string;
  categoryName: string;
  isVerified: boolean;
  isSinglePlayer: boolean;
  __typename: "Kink";
};

export type ProfileKink = {
  pleasureGive: -1 | 0 | 1 | 2 | number;
  pleasureReceive: -1 | 0 | 1 | 2 | number;
  kink: Kink;
  __typename: "ProfileKink";
};

export type Group = {
  uuid: string;
  displayName: string;
  isAd: boolean;
  isVerified: boolean;
  image: UploadedImage | null;
  __typename: "Group";
};

export type ProfileGroup = {
  group: Group;
  threadCount: number;
  replyCount: number;
  __typename: "ProfileGroup";
};

export type Event = {
  uuid: string;
  displayName: string;
  isAd: boolean;
  eventBeginAt: string;
  eventEndAt: string;
  image: UploadedImage | null;
  __typename: string;
};

export type ProfileEvent = {
  isWaitingList: boolean;
  event: Event;
  __typename: "ProfileEvent";
};

export type OverviewProfile = {
  uuid: string;
  displayName: string;
  username: string | null;
  roles: string[] | null;
  relationType: RelationType;
  primaryImage: UploadedImage | null;
  primaryImageAd: UploadedImage | null;
  location: {
    distance: number | null;
    type: string;
    place: { id: IDString; __typename: "Place" } | null;
    homePlace: { id: IDString; __typename: "Place" } | null;
    __typename: "ProfileLocation";
  } | null;
  __typename: "Profile";
};

export type ProfileDetail = {
  id: IDString;
  uuid: string;
  displayName: string;
  username: string | null;
  relationType: RelationType;
  isAdOptIn: boolean;
  isBirthday: boolean;
  age: number | null;
  primaryImage: UploadedImage | null;
  primaryImageAd: UploadedImage | null;
  headerImage: UploadedImage | null;
  headerImageAd: UploadedImage | null;
  privacySettings: PrivacySettings | null;
  images: ProfileImage[];
  location: ProfileLocation | null;
  bio: ProfileBio | null;
  socialAccounts: ProfileSocialAccount[] | null;
  bioAd: ProfileBioAd | null;
  sonas: Sona[] | null;
  kinks: ProfileKink[] | null;
  groups: ProfileGroup[] | null;
  events: ProfileEvent[] | null;
  roles: string[] | null;
  shareHash: string | null;
  __typename: "Profile";
};
