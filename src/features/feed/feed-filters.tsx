"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconSearch } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import type {
  FeedFilters,
  FeedLocationScope,
  FeedMode,
} from "@/domain/barq/types";
import { filtersToSearchParams } from "@/domain/barq/filters";
import {
  LocationAutocomplete,
  type SelectedLocation,
} from "@/features/filters/location-autocomplete";

const GENDERS = [
  "Female",
  "Male",
  "Transgender Female",
  "Transgender Male",
  "Non-Binary",
];

const RELATIONSHIPS = [
  ["single", "Single"],
  ["relationship", "Relationship"],
  ["open_relationship", "Open"],
  ["domestic_partnership", "Domestic"],
  ["engaged_married", "Married"],
  ["other", "Other"],
] as const;

const LOCATION_SCOPES = [
  { label: "Distance", value: "distance" },
  { label: "City", value: "city" },
  { label: "Region", value: "region" },
  { label: "Country", value: "country" },
] as const;

const RADII = [
  { label: "No limit", value: "infinite" },
  { label: "100 mi", value: "100mi" },
  { label: "250 mi", value: "250mi" },
] as const;

const LIVE_FILTER_DELAY_MS = 300;
type LocationSource = "implicit" | "explicit" | "unset";

export function FeedFiltersForm({
  filters,
  isDefaultLocationImplicit = false,
  mode,
  viewerName,
}: {
  filters: FeedFilters;
  isDefaultLocationImplicit?: boolean;
  mode: FeedMode;
  viewerName: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [locationEditing, setLocationEditing] = useState(false);
  const [draftMode, setDraftMode] = useState(mode);
  const [location, setLocation] = useState<SelectedLocation | null>(
    filters.location
      ? {
          label: filters.locationLabel ?? "Selected location",
          latitude: filters.location.latitude,
          longitude: filters.location.longitude,
        }
      : null,
  );
  const [locationSource, setLocationSource] = useState<LocationSource>(() => {
    if (filters.location) {
      return isDefaultLocationImplicit ? "implicit" : "explicit";
    }

    return "unset";
  });
  const [displayName, setDisplayName] = useState(filters.displayName ?? "");
  const [ageMin, setAgeMin] = useState(
    filters.ageMin === undefined ? "" : String(filters.ageMin),
  );
  const [ageMax, setAgeMax] = useState(
    filters.ageMax === undefined ? "" : String(filters.ageMax),
  );
  const [scope, setScope] = useState<FeedLocationScope>(
    filters.location?.type ?? "distance",
  );
  const [radius, setRadius] = useState<"infinite" | "100mi" | "250mi">(
    filters.radius ?? "infinite",
  );
  const [genders, setGenders] = useState(filters.genders ?? []);
  const [relationshipStatus, setRelationshipStatus] = useState(
    filters.relationshipStatus ?? [],
  );
  const [sexPositions] = useState(filters.sexPositions ?? []);
  const [requireProfileImage] = useState(filters.requireProfileImage ?? false);
  const nextFilters = useMemo(
    () =>
      buildFilters({
        ageMax,
        ageMin,
        displayName,
        genders,
        location,
        radius,
        relationshipStatus,
        requireProfileImage,
        scope,
        sexPositions,
      }),
    [
      ageMax,
      ageMin,
      displayName,
      genders,
      location,
      radius,
      relationshipStatus,
      requireProfileImage,
      scope,
      sexPositions,
    ],
  );
  const nextSearchParams = useMemo(
    () =>
      filtersToSearchParams(draftMode, nextFilters, {
        includeDefaultMode: false,
        includeImplicitLocation: locationSource !== "implicit",
      }).toString(),
    [draftMode, locationSource, nextFilters],
  );
  const currentSearchParams = searchParams.toString();
  const locationLabel = displayLocationLabel(location);

  useEffect(() => {
    if (currentSearchParams === nextSearchParams) {
      return;
    }

    const timer = window.setTimeout(() => {
      router.replace(feedHref(nextSearchParams), { scroll: false });
    }, LIVE_FILTER_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [currentSearchParams, nextSearchParams, router]);

  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <h1 className="max-w-4xl text-4xl leading-[1.05] font-bold tracking-tight text-balance sm:text-5xl">
          <span className="block">Hi {viewerName}!</span>
          <span className="block">
            You&apos;re in {""}
            <span className="inline align-baseline">
              {locationEditing ? (
                <LocationAutocomplete
                  autoFocus
                  initialLocation={location ?? undefined}
                  onClose={() => setLocationEditing(false)}
                  onSelect={(nextLocation) => {
                    if (!nextLocation) {
                      setLocationEditing(false);
                      return;
                    }

                    setLocation(nextLocation);
                    setLocationSource("explicit");
                    setLocationEditing(false);
                  }}
                  variant="inline"
                />
              ) : (
                <button
                  className="text-left text-primary underline decoration-primary/30 decoration-2 underline-offset-4 transition hover:decoration-primary/70 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                  type="button"
                  onClick={() => setLocationEditing(true)}
                >
                  {locationLabel}
                </button>
              )}
            </span>
          </span>
        </h1>

        <InputGroup className="h-10 bg-background/70 lg:mt-1 lg:w-80">
          <InputGroupAddon align="inline-start">
            <IconSearch className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Search by display name"
            name="displayName"
            placeholder="Find anyone"
            type="search"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </InputGroup>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex flex-wrap gap-2">
          {(["sfw", "nsfw"] as const).map((value) => (
            <Button
              key={value}
              type="button"
              variant={draftMode === value ? "default" : "outline"}
              aria-pressed={draftMode === value}
              onClick={() => setDraftMode(value)}
            >
              {value.toUpperCase()}
            </Button>
          ))}
        </div>
        <button
          aria-expanded={filtersOpen}
          className="text-sm font-medium text-muted-foreground underline underline-offset-4 transition hover:text-foreground"
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
        >
          Filter out the fluff
        </button>
      </div>

      {filtersOpen ? (
        <ItemGroup className="gap-0 divide-y divide-border/70">
          <FilterItem
            description="Choose who appears in your feed."
            title="Gender"
          >
            {GENDERS.map((gender) => (
              <ToggleButton
                key={gender}
                active={genders.includes(gender)}
                onClick={() =>
                  setGenders((values) =>
                    toggleListValue(values, gender, !values.includes(gender)),
                  )
                }
              >
                {gender}
              </ToggleButton>
            ))}
          </FilterItem>

          <FilterItem
            description="Match the kind of availability you want to see."
            title="Relationship"
          >
            {RELATIONSHIPS.map(([value, label]) => (
              <ToggleButton
                key={value}
                active={relationshipStatus.includes(value)}
                onClick={() =>
                  setRelationshipStatus((values) =>
                    toggleListValue(values, value, !values.includes(value)),
                  )
                }
              >
                {label}
              </ToggleButton>
            ))}
          </FilterItem>

          <FilterItem description="Keep results in a useful range." title="Age">
            <InputGroup className="w-28">
              <InputGroupAddon align="inline-start">
                <InputGroupText>Min</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                aria-label="Minimum age"
                min={18}
                type="number"
                value={ageMin}
                onChange={(event) => setAgeMin(event.target.value)}
              />
            </InputGroup>
            <span className="flex h-8 items-center text-sm text-muted-foreground">
              to
            </span>
            <InputGroup className="w-28">
              <InputGroupAddon align="inline-start">
                <InputGroupText>Max</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                aria-label="Maximum age"
                min={18}
                type="number"
                value={ageMax}
                onChange={(event) => setAgeMax(event.target.value)}
              />
            </InputGroup>
          </FilterItem>

          <FilterItem
            description="Decide how tightly location should match."
            title="Scope"
          >
            {LOCATION_SCOPES.map((option) => (
              <ToggleButton
                key={option.value}
                active={scope === option.value}
                onClick={() => {
                  setScope(option.value);
                  setLocationSource((source) =>
                    source === "implicit" ? "explicit" : source,
                  );
                }}
              >
                {option.label}
              </ToggleButton>
            ))}
          </FilterItem>

          <FilterItem
            description="Only applies when scope is distance."
            title="Radius"
          >
            {RADII.map((option) => (
              <ToggleButton
                key={option.value}
                active={radius === option.value}
                disabled={scope !== "distance"}
                onClick={() => {
                  setRadius(option.value);
                  setLocationSource((source) =>
                    source === "implicit" ? "explicit" : source,
                  );
                }}
              >
                {option.label}
              </ToggleButton>
            ))}
          </FilterItem>
        </ItemGroup>
      ) : null}
    </section>
  );
}

function FilterItem({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <Item className="flex-col items-start rounded-none border-0 px-0 py-4 sm:flex-row">
      <ItemContent className="w-full sm:w-64 sm:flex-none">
        <ItemTitle>{title}</ItemTitle>
        <ItemDescription>{description}</ItemDescription>
      </ItemContent>
      <ItemActions className="flex w-full flex-wrap justify-start gap-2 sm:ml-auto sm:w-auto sm:flex-1 sm:justify-end">
        {children}
      </ItemActions>
    </Item>
  );
}

function ToggleButton({
  active,
  children,
  disabled,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      aria-pressed={active}
      disabled={disabled}
      size="sm"
      type="button"
      variant={active ? "default" : "outline"}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function buildFilters({
  ageMax,
  ageMin,
  displayName,
  genders,
  location,
  radius,
  relationshipStatus,
  requireProfileImage,
  scope,
  sexPositions,
}: {
  ageMax: string;
  ageMin: string;
  displayName: string;
  genders: string[];
  location: SelectedLocation | null;
  radius: "infinite" | "100mi" | "250mi";
  relationshipStatus: string[];
  requireProfileImage: boolean;
  scope: FeedLocationScope;
  sexPositions: string[];
}): FeedFilters {
  return {
    displayName: displayName.trim() || undefined,
    ageMin: formNumber(ageMin),
    ageMax: formNumber(ageMax),
    requireProfileImage,
    genders,
    relationshipStatus,
    sexPositions,
    location: location
      ? {
          latitude: location.latitude,
          longitude: location.longitude,
          type: scope,
          distanceKm:
            radius === "100mi" ? 161 : radius === "250mi" ? 402 : undefined,
        }
      : undefined,
    locationLabel: location?.label,
    radius: radius === "100mi" || radius === "250mi" ? radius : "infinite",
  };
}

function displayLocationLabel(location: SelectedLocation | null) {
  if (!location) {
    return "your location";
  }

  return location.label;
}

function feedHref(searchParams: string): string {
  return searchParams ? `/feed?${searchParams}` : "/feed";
}

function formNumber(value: string): number | undefined {
  const text = value.trim();
  if (!text) {
    return undefined;
  }

  const number = Number(text);
  return Number.isFinite(number) ? number : undefined;
}

function toggleListValue(
  values: string[],
  value: string,
  checked: boolean,
): string[] {
  if (checked) {
    return values.includes(value) ? values : [...values, value];
  }

  return values.filter((item) => item !== value);
}
