export type IDString = string;

export type UploadedImage = {
  uuid: string;
  contentRating: "safe" | "explicit" | null;
  width: number | null;
  height: number | null;
  blurHash: string | null;
  __typename: "UploadedImage";
};

export type Place = {
  id: IDString;
  place: string;
  region: string | null;
  country: string;
  countryCode: string;
  longitude: number;
  latitude: number;
  __typename: "Place";
};

export type PrivacyVisibility =
  | "public"
  | "liked"
  | "friends"
  | "mutuals"
  | "private"
  | string;

export type RelationType =
  | "liked"
  | "likes_you"
  | "mutual"
  | "friend"
  | null
  | string;
