"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import type { FeedFilters, FeedLocationScope, FeedMode } from "@/domain/barq/types";
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

export function FeedFiltersForm({
  mode,
  filters,
}: {
  mode: FeedMode;
  filters: FeedFilters;
}) {
  const router = useRouter();
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

  return (
    <form
      className="grid gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const nextFilters = filtersFromFormData(formData, location);
        const params = filtersToSearchParams(draftMode, nextFilters);
        router.push(`/feed?${params.toString()}`);
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(["sfw", "nsfw"] as const).map((value) => (
            <Button
              key={value}
              type="button"
              variant={draftMode === value ? "default" : "outline"}
              onClick={() => setDraftMode(value)}
            >
              {value.toUpperCase()}
            </Button>
          ))}
        </div>
        <Button type="submit">Apply filters</Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="grid gap-2 lg:col-span-2">
          <Label htmlFor="displayName">Display name</Label>
          <Input
            defaultValue={filters.displayName ?? ""}
            id="displayName"
            name="displayName"
            type="search"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="ageMin">Age min</Label>
          <Input
            defaultValue={filters.ageMin ?? ""}
            id="ageMin"
            min={18}
            name="ageMin"
            type="number"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="ageMax">Age max</Label>
          <Input
            defaultValue={filters.ageMax ?? ""}
            id="ageMax"
            min={18}
            name="ageMax"
            type="number"
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_160px_160px]">
        <div className="grid gap-2">
          <Label>Location</Label>
          <LocationAutocomplete initialLocation={location ?? undefined} onSelect={setLocation} />
        </div>
        <div className="grid gap-2">
          <Label>Scope</Label>
          <Select
            defaultValue={filters.location?.type ?? "distance"}
            items={LOCATION_SCOPES}
            name="scope"
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
          <Select defaultValue={filters.radius ?? "infinite"} items={RADII} name="radius">
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
          defaultValues={filters.genders}
          label="Genders"
          name="genders"
          options={GENDERS.map((value) => [value, value])}
        />
        <CheckboxGroup
          defaultValues={filters.relationshipStatus}
          label="Relationship"
          name="relationshipStatus"
          options={RELATIONSHIPS}
        />
        <CheckboxGroup
          defaultValues={filters.sexPositions}
          label="Sex positions"
          name="sexPositions"
          options={SEX_POSITIONS}
        />
      </div>

      <Label>
        <Checkbox
          defaultChecked={filters.requireProfileImage ?? false}
          name="requireProfileImage"
          value="1"
        />
        Require profile image
      </Label>
    </form>
  );
}

function CheckboxGroup({
  defaultValues,
  label,
  name,
  options,
}: {
  defaultValues?: string[];
  label: string;
  name: string;
  options: readonly (readonly [string, string])[];
}) {
  return (
    <div aria-label={label} className="grid gap-2" role="group">
      <Label>{label}</Label>
      <div className="grid gap-2">
        {options.map(([value, text]) => (
          <Label key={value}>
            <Checkbox
              defaultChecked={defaultValues?.includes(value)}
              name={name}
              value={value}
            />
            {text}
          </Label>
        ))}
      </div>
    </div>
  );
}

function filtersFromFormData(formData: FormData, location: SelectedLocation | null): FeedFilters {
  const scope = formText(formData, "scope") as FeedLocationScope;
  const radius = formText(formData, "radius");

  return {
    displayName: formText(formData, "displayName"),
    ageMin: formNumber(formData, "ageMin"),
    ageMax: formNumber(formData, "ageMax"),
    requireProfileImage: formData.get("requireProfileImage") === "1",
    genders: formData.getAll("genders").map(String),
    relationshipStatus: formData.getAll("relationshipStatus").map(String),
    sexPositions: formData.getAll("sexPositions").map(String),
    location: location
      ? {
          latitude: location.latitude,
          longitude: location.longitude,
          type: scope,
          distanceKm: radius === "100mi" ? 161 : radius === "250mi" ? 402 : undefined,
        }
      : undefined,
    locationLabel: location?.label,
    radius: radius === "100mi" || radius === "250mi" ? radius : "infinite",
  };
}

function formText(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function formNumber(formData: FormData, key: string): number | undefined {
  const value = formText(formData, key);
  if (!value) {
    return undefined;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}
