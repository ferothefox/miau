import {
  DEFAULT_PROFILE_LIMIT,
  MAX_PROFILE_LIMIT,
  type FeedFilters,
  type FeedLocationScope,
  type FeedMode,
  type ProfileSearchVariables,
} from "./types";

export type SearchParamValue = string | string[] | undefined;
export type SearchParamRecord = Record<string, SearchParamValue>;

export const FEED_MODES = ["sfw", "nsfw"] as const;

const LOCATION_SCOPES = ["distance", "city", "region", "country"] as const;

const RADIUS_TO_KM = {
  "100mi": 161,
  "250mi": 402,
} as const;

function firstParam(value: SearchParamValue): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function cleanString(value: SearchParamValue): string | undefined {
  const text = firstParam(value)?.trim();
  return text ? text : undefined;
}

function parseNumber(value: SearchParamValue): number | undefined {
  const text = cleanString(value);
  if (!text) {
    return undefined;
  }

  const number = Number(text);
  return Number.isFinite(number) ? number : undefined;
}

function parseBoolean(value: SearchParamValue): boolean | undefined {
  const text = cleanString(value);
  if (!text) {
    return undefined;
  }

  if (["1", "true", "yes", "on"].includes(text.toLowerCase())) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(text.toLowerCase())) {
    return false;
  }

  return undefined;
}

function parseList(value: SearchParamValue): string[] | undefined {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  const items = values
    .flatMap((entry) => entry.split(","))
    .map((entry) => entry.trim())
    .filter(Boolean);

  return items.length > 0 ? Array.from(new Set(items)) : undefined;
}

function isFeedMode(value: string | undefined): value is FeedMode {
  return value === "sfw" || value === "nsfw";
}

function isLocationScope(value: string | undefined): value is FeedLocationScope {
  return LOCATION_SCOPES.some((scope) => scope === value);
}

export function parseFeedMode(searchParams: SearchParamRecord): FeedMode {
  const mode = cleanString(searchParams.mode);
  return isFeedMode(mode) ? mode : "sfw";
}

export function parseFeedFilters(searchParams: SearchParamRecord): FeedFilters {
  const latitude = parseNumber(searchParams.lat);
  const longitude = parseNumber(searchParams.lng);
  const scopeParam = cleanString(searchParams.scope);
  const radiusParam = cleanString(searchParams.radius);
  const scope = isLocationScope(scopeParam) ? scopeParam : "distance";
  const radius =
    radiusParam === "100mi" || radiusParam === "250mi"
      ? radiusParam
      : radiusParam === "infinite"
        ? "infinite"
        : undefined;

  const filters: FeedFilters = {
    displayName: cleanString(searchParams.displayName),
    locationLabel: cleanString(searchParams.location),
    requireProfileImage: parseBoolean(searchParams.requireProfileImage),
    ageMin: parseNumber(searchParams.ageMin),
    ageMax: parseNumber(searchParams.ageMax),
    genders: parseList(searchParams.genders),
    relationshipStatus: parseList(searchParams.relationshipStatus),
    sexPositions: parseList(searchParams.sexPositions),
  };

  if (latitude !== undefined && longitude !== undefined) {
    const distanceKm =
      scope === "distance" && (radius === "100mi" || radius === "250mi")
        ? RADIUS_TO_KM[radius]
        : undefined;

    filters.location = {
      latitude,
      longitude,
      type: scope,
      distanceKm,
    };
    filters.radius = radius;
  }

  return normalizeFeedFilters(filters);
}

export function normalizeFeedFilters(filters: FeedFilters): FeedFilters {
  return {
    displayName: filters.displayName?.trim() || undefined,
    location: filters.location
      ? {
          latitude: filters.location.latitude,
          longitude: filters.location.longitude,
          type: filters.location.type,
          distanceKm: filters.location.distanceKm,
        }
      : undefined,
    locationLabel: filters.locationLabel?.trim() || undefined,
    radius: filters.radius,
    requireProfileImage: filters.requireProfileImage || undefined,
    ageMin: normalizeAge(filters.ageMin),
    ageMax: normalizeAge(filters.ageMax),
    genders: normalizeList(filters.genders),
    relationshipStatus: normalizeList(filters.relationshipStatus),
    sexPositions: normalizeList(filters.sexPositions),
  };
}

export function feedModeToIsAd(mode: FeedMode): boolean {
  return mode === "nsfw";
}

export function clampProfileLimit(limit: number): number {
  if (!Number.isFinite(limit)) {
    return DEFAULT_PROFILE_LIMIT;
  }

  return Math.max(1, Math.min(Math.trunc(limit), MAX_PROFILE_LIMIT));
}

export function nextCursor(cursor: string, returnedCount: number): string {
  const offset = cursor.trim() ? Number(cursor) : 0;
  const safeOffset = Number.isFinite(offset) && offset > 0 ? offset : 0;
  return String(safeOffset + Math.max(0, returnedCount));
}

export function toProfileSearchVariables({
  mode,
  filters,
  cursor,
  limit = DEFAULT_PROFILE_LIMIT,
}: {
  mode: FeedMode;
  filters: FeedFilters;
  cursor?: string;
  limit?: number;
}): ProfileSearchVariables {
  const normalized = normalizeFeedFilters(filters);
  const variables: ProfileSearchVariables = {
    isAd: feedModeToIsAd(mode),
    filters: {},
    cursor: cursor ?? "",
    limit: clampProfileLimit(limit),
  };

  if (normalized.displayName) {
    variables.filters.displayName = normalized.displayName;
  }

  if (normalized.location) {
    variables.filters.location = {
      latitude: normalized.location.latitude,
      longitude: normalized.location.longitude,
      type: normalized.location.type,
      distance: normalized.location.distanceKm,
    };

    if (variables.filters.location.distance === undefined) {
      delete variables.filters.location.distance;
    }
  }

  if (normalized.requireProfileImage) {
    variables.filters.requireProfileImage = true;
  }

  if (normalized.ageMin !== undefined || normalized.ageMax !== undefined) {
    variables.filters.age = {
      min: normalized.ageMin,
      max: normalized.ageMax,
    };

    if (variables.filters.age.min === undefined) {
      delete variables.filters.age.min;
    }

    if (variables.filters.age.max === undefined) {
      delete variables.filters.age.max;
    }
  }

  if (normalized.genders) {
    variables.filters.genders = normalized.genders;
  }

  if (normalized.relationshipStatus) {
    variables.filters.relationshipStatus = normalized.relationshipStatus;
  }

  if (normalized.sexPositions) {
    variables.filters.sexPositions = normalized.sexPositions;
  }

  return variables;
}

export function filtersToSearchParams(mode: FeedMode, filters: FeedFilters): URLSearchParams {
  const normalized = normalizeFeedFilters(filters);
  const params = new URLSearchParams();

  params.set("mode", mode);
  setParam(params, "displayName", normalized.displayName);
  setParam(params, "location", normalized.locationLabel);
  setParam(params, "ageMin", normalized.ageMin);
  setParam(params, "ageMax", normalized.ageMax);
  setParam(params, "genders", normalized.genders);
  setParam(params, "relationshipStatus", normalized.relationshipStatus);
  setParam(params, "sexPositions", normalized.sexPositions);

  if (normalized.requireProfileImage) {
    params.set("requireProfileImage", "1");
  }

  if (normalized.location) {
    params.set("lat", String(normalized.location.latitude));
    params.set("lng", String(normalized.location.longitude));
    params.set("scope", normalized.location.type);
    if (normalized.radius) {
      params.set("radius", normalized.radius);
    }
  }

  return params;
}

export function feedCacheKey(viewerId: number | undefined, mode: FeedMode, filters: FeedFilters) {
  return ["feed", viewerId ?? "anonymous", mode, JSON.stringify(normalizeFeedFilters(filters))] as const;
}

function normalizeAge(age: number | undefined): number | undefined {
  if (age === undefined || !Number.isFinite(age)) {
    return undefined;
  }

  return Math.max(18, Math.min(120, Math.trunc(age)));
}

function normalizeList(list: string[] | undefined): string[] | undefined {
  const values = list?.map((item) => item.trim()).filter(Boolean);
  return values?.length ? Array.from(new Set(values)) : undefined;
}

function setParam(
  params: URLSearchParams,
  key: string,
  value: string | number | string[] | undefined,
) {
  if (value === undefined) {
    return;
  }

  if (Array.isArray(value)) {
    if (value.length > 0) {
      params.set(key, value.join(","));
    }
    return;
  }

  params.set(key, String(value));
}
