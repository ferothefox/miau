import type { FeedMode, ProfileDetail, UploadedImage } from "./types";

export const BARQ_ASSET_ORIGIN = "https://assets.barq.app";

export function imageUrl(uuid: string, width: number): string {
  return `${BARQ_ASSET_ORIGIN}/image/${uuid}.jpeg?width=${width}`;
}

export function choosePrimaryImage(
  profile: {
    primaryImage: UploadedImage | null;
    primaryImageAd: UploadedImage | null;
  },
  mode: FeedMode,
): UploadedImage | null {
  return mode === "nsfw"
    ? profile.primaryImageAd ?? profile.primaryImage
    : profile.primaryImage;
}

export function chooseHeaderImage(
  profile: {
    headerImage?: UploadedImage | null;
    headerImageAd?: UploadedImage | null;
  },
  mode: FeedMode,
): UploadedImage | null {
  return mode === "nsfw"
    ? profile.headerImageAd ?? profile.headerImage ?? null
    : profile.headerImage ?? null;
}

export function imageAspectRatio(image: UploadedImage | null): string {
  if (!image?.width || !image.height || image.width <= 0 || image.height <= 0) {
    return "1 / 1";
  }

  return `${image.width} / ${image.height}`;
}

export function profileImageAlt(
  profile: Pick<ProfileDetail, "displayName" | "username">,
  fallback = "Profile image",
): string {
  if (profile.displayName) {
    return `${profile.displayName} profile image`;
  }

  if (profile.username) {
    return `@${profile.username} profile image`;
  }

  return fallback;
}
