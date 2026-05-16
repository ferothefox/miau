"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  ["open_relationship", "Open relationship"],
  ["domestic_partnership", "Domestic partnership"],
  ["engaged_married", "Engaged/married"],
  ["other", "Other"],
] as const;

const SEX_POSITIONS = [
  ["top", "Top"],
  ["bottom", "Bottom"],
] as const;

const LOCATION_SCOPES = [
  { label: "Distance", value: "distance" },
  { label: "City", value: "city" },
  { label: "Region", value: "region" },
  { label: "Country", value: "country" },
] as const;

const RADII = [
  { label: "Any distance", value: "infinite" },
  { label: "100 miles", value: "100mi" },
  { label: "250 miles", value: "250mi" },
] as const;

const LIVE_FILTER_DELAY_MS = 300;

export function FeedFiltersForm({
  mode,
  filters,
}: {
  mode: FeedMode;
  filters: FeedFilters;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [requireProfileImage, setRequireProfileImage] = useState(
    filters.requireProfileImage ?? false,
  );
  const [genders, setGenders] = useState(filters.genders ?? []);
  const [relationshipStatus, setRelationshipStatus] = useState(
    filters.relationshipStatus ?? [],
  );
  const [sexPositions, setSexPositions] = useState(
    filters.sexPositions ?? [],
  );
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
    () => filtersToSearchParams(draftMode, nextFilters).toString(),
    [draftMode, nextFilters],
  );
  const currentSearchParams = searchParams.toString();

  useEffect(() => {
    if (currentSearchParams === nextSearchParams) {
      return;
    }

    const timer = window.setTimeout(() => {
      router.replace(`/feed?${nextSearchParams}`, { scroll: false });
    }, LIVE_FILTER_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [currentSearchParams, nextSearchParams, router]);

  return (
    <form
      className="grid gap-6"
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
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
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="grid gap-2 lg:col-span-2">
          <Label htmlFor="displayName">Display name</Label>
          <Input
            id="displayName"
            name="displayName"
            type="search"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="ageMin">Age min</Label>
          <Input
            id="ageMin"
            min={18}
            name="ageMin"
            type="number"
            value={ageMin}
            onChange={(event) => setAgeMin(event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="ageMax">Age max</Label>
          <Input
            id="ageMax"
            min={18}
            name="ageMax"
            type="number"
            value={ageMax}
            onChange={(event) => setAgeMax(event.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_160px_160px]">
        <div className="grid gap-2">
          <Label>Location</Label>
          <LocationAutocomplete
            initialLocation={location ?? undefined}
            onSelect={setLocation}
          />
        </div>
        <div className="grid gap-2">
          <Label>Scope</Label>
          <Select
            items={LOCATION_SCOPES}
            name="scope"
            value={scope}
            onValueChange={(value) => {
              if (isLocationScope(value)) {
                setScope(value);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectGroup>
                {LOCATION_SCOPES.map((scope) => (
                  <SelectItem key={scope.value} value={scope.value}>
                    {scope.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Radius</Label>
          <Select
            items={RADII}
            name="radius"
            value={radius}
            onValueChange={(value) => {
              if (isRadius(value)) {
                setRadius(value);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectGroup>
                {RADII.map((radius) => (
                  <SelectItem key={radius.value} value={radius.value}>
                    {radius.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <CheckboxGroup
          label="Genders"
          name="genders"
          options={GENDERS.map((value) => [value, value])}
          values={genders}
          onValuesChange={setGenders}
        />
        <CheckboxGroup
          label="Relationship"
          name="relationshipStatus"
          options={RELATIONSHIPS}
          values={relationshipStatus}
          onValuesChange={setRelationshipStatus}
        />
        <CheckboxGroup
          label="Sex positions"
          name="sexPositions"
          options={SEX_POSITIONS}
          values={sexPositions}
          onValuesChange={setSexPositions}
        />
      </div>

      <Label>
        <Checkbox
          checked={requireProfileImage}
          name="requireProfileImage"
          value="1"
          onCheckedChange={setRequireProfileImage}
        />
        Require profile image
      </Label>
    </form>
  );
}

function CheckboxGroup({
  label,
  name,
  onValuesChange,
  options,
  values,
}: {
  label: string;
  name: string;
  onValuesChange: (values: string[]) => void;
  options: readonly (readonly [string, string])[];
  values: string[];
}) {
  return (
    <div aria-label={label} className="grid gap-2" role="group">
      <Label>{label}</Label>
      <div className="grid gap-2">
        {options.map(([value, text]) => (
          <Label key={value}>
            <Checkbox
              checked={values.includes(value)}
              name={name}
              value={value}
              onCheckedChange={(checked) => {
                onValuesChange(toggleListValue(values, value, checked));
              }}
            />
            {text}
          </Label>
        ))}
      </div>
    </div>
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

function formNumber(value: string): number | undefined {
  const text = value.trim();
  if (!text) {
    return undefined;
  }

  const number = Number(text);
  return Number.isFinite(number) ? number : undefined;
}

function isLocationScope(value: unknown): value is FeedLocationScope {
  return (
    value === "distance" ||
    value === "city" ||
    value === "region" ||
    value === "country"
  );
}

function isRadius(value: unknown): value is "infinite" | "100mi" | "250mi" {
  return value === "infinite" || value === "100mi" || value === "250mi";
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
