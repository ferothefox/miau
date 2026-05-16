import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  applyDefaultFeedLocation,
  clampProfileLimit,
  feedModeToIsAd,
  filtersToSearchParams,
  nextCursor,
  parseFeedFilters,
  shouldUseDefaultFeedLocation,
  toProfileSearchVariables,
} from "./filters";
import { chooseHeaderImage, choosePrimaryImage, imageUrl } from "./images";
import {
  groupKinksByCategory,
  hydrateSonaImages,
  normalizeProfileDetail,
  splitProfileImages,
} from "./normalize";
import type { ProfileDetail, ProfileImage, UploadedImage } from "./types";
import { detectAuthErrorCode } from "@/server/barq/errors";
import { buildGraphQLRequestInit } from "@/server/barq/request";

const safeImage: UploadedImage = {
  uuid: "safe-image",
  contentRating: "safe",
  width: 800,
  height: 600,
  blurHash: null,
  __typename: "UploadedImage",
};

const adImage: UploadedImage = {
  uuid: "ad-image",
  contentRating: "explicit",
  width: 800,
  height: 1000,
  blurHash: null,
  __typename: "UploadedImage",
};

describe("Barq request handling", () => {
  test("sends the encoded JWT as a bearer token only", () => {
    const encodedJwt = "aaa.eyJpZCI6MTIzLCJ0b2tlbiI6InNlY3JldCJ9.bbb";
    const init = buildGraphQLRequestInit({
      token: encodedJwt,
      operationName: "User",
      query: "query User { user { isOnboarded } }",
      variables: {},
    });

    expect((init.headers as Record<string, string>).authorization).toBe(
      `Bearer ${encodedJwt}`,
    );
    expect(init.body).not.toContain('"id":123');
    expect(init.body).not.toContain("secret");
  });

  test("normalizes known auth failures", () => {
    expect(
      detectAuthErrorCode([
        { message: "Cannot read properties of undefined (reading 'split')" },
      ]),
    ).toBe("AUTH_MISSING");
    expect(detectAuthErrorCode([{ message: "invalid signature" }])).toBe(
      "AUTH_SIGNATURE_INVALID",
    );
    expect(
      detectAuthErrorCode([
        { extensions: { code: "UNAUTHENTICATED" }, message: "Token invalid" },
      ]),
    ).toBe("AUTH_INVALID");
  });

  test("keeps ProfileDetail aligned with Barq web query shape", () => {
    const source = readFileSync(
      join(process.cwd(), "src/server/barq/operations/profile-detail.ts"),
      "utf8",
    );
    const fragments = readFileSync(
      join(process.cwd(), "src/server/barq/operations/fragments.ts"),
      "utf8",
    );
    const profileDetailFragments = fragments.slice(
      fragments.indexOf("export const PROFILE_DETAIL_FRAGMENTS"),
      fragments.indexOf("export const BLOCKED_CONTENT_FRAGMENT"),
    );

    expect(source).toContain("query ProfileDetail($uuid: String!)");
    expect(source).toContain("distance");
    expect(source).not.toContain("precision");
    expect(profileDetailFragments).not.toContain("BlockedContentFragment");
  });
});

describe("feed filters", () => {
  test("maps mode to isAd", () => {
    expect(feedModeToIsAd("sfw")).toBe(false);
    expect(feedModeToIsAd("nsfw")).toBe(true);
  });

  test("clamps profile limits and increments string cursors", () => {
    expect(clampProfileLimit(100)).toBe(99);
    expect(clampProfileLimit(Number.NaN)).toBe(60);
    expect(nextCursor("", 60)).toBe("60");
    expect(nextCursor("60", 39)).toBe("99");
  });

  test("serializes filters and translates location radius to kilometers", () => {
    const params = filtersToSearchParams("nsfw", {
      displayName: "Scout",
      ageMin: 21,
      requireProfileImage: true,
      genders: ["Non-Binary"],
      locationLabel: "Phoenix, AZ, US",
      radius: "100mi",
      location: {
        latitude: 33.4484,
        longitude: -112.074,
        type: "distance",
        distanceKm: 161,
      },
    });

    expect(params.get("mode")).toBe("nsfw");
    expect(params.get("requireProfileImage")).toBe("1");

    const filters = parseFeedFilters(Object.fromEntries(params.entries()));
    const variables = toProfileSearchVariables({
      mode: "nsfw",
      filters,
      cursor: "60",
      limit: 100,
    });

    expect(variables.isAd).toBe(true);
    expect(variables.limit).toBe(99);
    expect(variables.filters.location?.distance).toBe(161);
    expect(variables.filters.age?.min).toBe(21);
  });

  test("defaults feed location from the viewer current place", () => {
    const filters = applyDefaultFeedLocation(
      {},
      {
        type: "gps",
        distance: null,
        precision: null,
        homePlace: null,
        place: {
          id: "3035",
          place: "Tempe",
          region: "Arizona",
          country: "United States",
          countryCode: "US",
          longitude: -111.9094,
          latitude: 33.4144,
          __typename: "Place",
        },
        __typename: "ProfileLocation",
      },
    );

    expect(filters.locationLabel).toBe("Tempe, Arizona, US");
    expect(filters.location).toEqual({
      latitude: 33.4144,
      longitude: -111.9094,
      type: "distance",
      distanceKm: undefined,
    });
    expect(filters.radius).toBe("infinite");
  });

  test("keeps implicit default location out of feed URLs", () => {
    const params = filtersToSearchParams(
      "sfw",
      {
        locationLabel: "Tempe, Arizona, US",
        radius: "infinite",
        location: {
          latitude: 33.4144,
          longitude: -111.9094,
          type: "distance",
        },
      },
      {
        includeDefaultMode: false,
        includeImplicitLocation: false,
      },
    );

    expect(params.toString()).toBe("");
  });

  test("treats legacy Anywhere location URLs as the default viewer location", () => {
    const params = { mode: "sfw", location: "Anywhere" };
    const filters = applyDefaultFeedLocation(
      parseFeedFilters(params),
      {
        type: "gps",
        distance: null,
        precision: null,
        homePlace: null,
        place: {
          id: "3035",
          place: "Tempe",
          region: "Arizona",
          country: "United States",
          countryCode: "US",
          longitude: -111.9094,
          latitude: 33.4144,
          __typename: "Place",
        },
        __typename: "ProfileLocation",
      },
      { enabled: shouldUseDefaultFeedLocation(params) },
    );

    expect(shouldUseDefaultFeedLocation(params)).toBe(true);
    expect(filters.locationLabel).toBe("Tempe, Arizona, US");
    expect(filters.location).toEqual({
      latitude: 33.4144,
      longitude: -111.9094,
      type: "distance",
      distanceKm: undefined,
    });
  });

  test("does not serialize location labels without coordinates", () => {
    const params = filtersToSearchParams(
      "sfw",
      { locationLabel: "Anywhere" },
      {
        includeDefaultMode: false,
      },
    );

    expect(params.toString()).toBe("");
  });
});

describe("image helpers and normalizers", () => {
  test("generates Barq asset URLs and selects images by mode", () => {
    expect(imageUrl("abc", 512)).toBe(
      "https://assets.barq.app/image/abc.jpeg?width=512",
    );
    expect(
      choosePrimaryImage(
        { primaryImage: safeImage, primaryImageAd: adImage },
        "sfw",
      ),
    ).toBe(safeImage);
    expect(
      choosePrimaryImage(
        { primaryImage: safeImage, primaryImageAd: adImage },
        "nsfw",
      ),
    ).toBe(adImage);
    expect(
      chooseHeaderImage(
        { headerImage: safeImage, headerImageAd: adImage },
        "nsfw",
      ),
    ).toBe(adImage);
  });

  test("splits locked images", () => {
    const images: ProfileImage[] = [
      {
        id: "1",
        image: safeImage,
        accessPermission: "public",
        isAd: false,
        __typename: "ProfileImage",
      },
      {
        id: "2",
        image: null,
        accessPermission: "friends",
        isAd: false,
        __typename: "ProfileImage",
      },
    ];

    expect(splitProfileImages(images).visible).toHaveLength(1);
    expect(splitProfileImages(images).locked).toHaveLength(1);
  });

  test("hydrates sona image references from profile images", () => {
    const profile = {
      images: [
        {
          id: "image-1",
          image: safeImage,
          accessPermission: "public",
          isAd: false,
          __typename: "ProfileImage",
        },
      ],
      sonas: [
        {
          id: "sona-1",
          displayName: "Scout",
          hasFursuit: true,
          species: null,
          images: [
            {
              id: "image-1",
              image: null,
              isAd: true,
              __typename: "ProfileImage",
            },
          ],
          __typename: "Sona",
        },
      ],
    } satisfies Pick<ProfileDetail, "images" | "sonas">;

    expect(hydrateSonaImages(profile)[0].images[0].image).toBe(safeImage);
    expect(hydrateSonaImages(profile)[0].images[0].isAd).toBe(false);
  });

  test("groups kinks and tolerates null-heavy profiles", () => {
    const groups = groupKinksByCategory([
      {
        pleasureGive: 1,
        pleasureReceive: 2,
        kink: {
          id: "2",
          displayName: "Beta",
          categoryName: "Play",
          isVerified: false,
          isSinglePlayer: false,
          __typename: "Kink",
        },
        __typename: "ProfileKink",
      },
      {
        pleasureGive: 1,
        pleasureReceive: 2,
        kink: {
          id: "1",
          displayName: "Alpha",
          categoryName: "Play",
          isVerified: false,
          isSinglePlayer: false,
          __typename: "Kink",
        },
        __typename: "ProfileKink",
      },
    ]);

    expect(groups[0].categoryName).toBe("Play");
    expect(
      groups[0].kinks.map((profileKink) => profileKink.kink.displayName),
    ).toEqual(["Alpha", "Beta"]);

    const normalized = normalizeProfileDetail({
      id: "1",
      uuid: "uuid",
      displayName: "Null Profile",
      username: null,
      relationType: null,
      isAdOptIn: false,
      isBirthday: false,
      age: null,
      primaryImage: null,
      primaryImageAd: null,
      headerImage: null,
      headerImageAd: null,
      privacySettings: null,
      images: [],
      location: null,
      bio: null,
      socialAccounts: null,
      bioAd: null,
      sonas: null,
      kinks: null,
      groups: null,
      events: null,
      roles: null,
      shareHash: null,
      __typename: "Profile",
    });

    expect(normalized.socialAccounts).toEqual([]);
    expect(normalized.sonas).toEqual([]);
    expect(normalized.kinks).toEqual([]);
  });
});
