import type {
  ProfileDetail,
  ProfileImage,
  ProfileKink,
  Sona,
  SonaImage,
} from "./types";

export type GalleryGroups = {
  visible: ProfileImage[];
  locked: ProfileImage[];
};

export type KinkCategory = {
  categoryName: string;
  kinks: ProfileKink[];
};

export function splitProfileImages(
  images: ProfileImage[] | null | undefined,
): GalleryGroups {
  const safeImages = images ?? [];

  return {
    visible: safeImages.filter((image) => image.image !== null),
    locked: safeImages.filter((image) => image.image === null),
  };
}

export function hydrateSonaImages(
  profile: Pick<ProfileDetail, "images" | "sonas">,
): Sona[] {
  const imagesById = new Map(
    (profile.images ?? []).map((image) => [image.id, image]),
  );

  return (profile.sonas ?? []).map((sona) => ({
    ...sona,
    images: sona.images.map((sonaImage) => {
      const profileImage = imagesById.get(sonaImage.id);
      return {
        ...sonaImage,
        image: profileImage?.image ?? sonaImage.image,
        isAd: profileImage?.isAd ?? sonaImage.isAd,
      } satisfies SonaImage;
    }),
  }));
}

export function groupKinksByCategory(
  kinks: ProfileKink[] | null | undefined,
): KinkCategory[] {
  const groups = new Map<string, ProfileKink[]>();

  for (const profileKink of kinks ?? []) {
    const category = profileKink.kink.categoryName || "Other";
    const group = groups.get(category);

    if (group) {
      group.push(profileKink);
    } else {
      groups.set(category, [profileKink]);
    }
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([categoryName, groupedKinks]) => ({
      categoryName,
      kinks: [...groupedKinks].sort((a, b) =>
        a.kink.displayName.localeCompare(b.kink.displayName),
      ),
    }));
}

export function normalizeProfileDetail(profile: ProfileDetail): ProfileDetail {
  return {
    ...profile,
    images: profile.images ?? [],
    socialAccounts: profile.socialAccounts ?? [],
    sonas: profile.sonas ?? [],
    kinks: profile.kinks ?? [],
    groups: profile.groups ?? [],
    events: profile.events ?? [],
    roles: profile.roles ?? [],
  };
}

export function distanceLabel(
  distance: number | null | undefined,
): string | null {
  if (
    distance === null ||
    distance === undefined ||
    !Number.isFinite(distance)
  ) {
    return null;
  }

  const miles = distance * 0.621371;
  if (miles < 1) {
    return "<1 mi";
  }

  return `${Math.round(miles)} mi`;
}
