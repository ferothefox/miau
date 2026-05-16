"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
      className="grid gap-5 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const nextFilters = filtersFromFormData(formData, location);
        const params = filtersToSearchParams(draftMode, nextFilters);
        router.push(`/feed?${params.toString()}`);
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-zinc-300 bg-zinc-100 p-1">
          {(["sfw", "nsfw"] as const).map((value) => (
            <button
              className={
                draftMode === value
                  ? "rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-zinc-950 shadow-sm"
                  : "rounded-md px-3 py-1.5 text-sm font-semibold text-zinc-600 hover:text-zinc-950"
              }
              key={value}
              type="button"
              onClick={() => setDraftMode(value)}
            >
              {value.toUpperCase()}
            </button>
          ))}
        </div>
        <button
          className="h-10 rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800"
          type="submit"
        >
          Apply filters
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <label className="space-y-2 lg:col-span-2">
          <span className="text-sm font-medium text-zinc-800">Display name</span>
          <input
            className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
            defaultValue={filters.displayName ?? ""}
            name="displayName"
            type="search"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-zinc-800">Age min</span>
          <input
            className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
            defaultValue={filters.ageMin ?? ""}
            min={18}
            name="ageMin"
            type="number"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-zinc-800">Age max</span>
          <input
            className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
            defaultValue={filters.ageMax ?? ""}
            min={18}
            name="ageMax"
            type="number"
          />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_160px_160px]">
        <label className="space-y-2">
          <span className="text-sm font-medium text-zinc-800">Location</span>
          <LocationAutocomplete initialLocation={location ?? undefined} onSelect={setLocation} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-zinc-800">Scope</span>
          <select
            className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
            defaultValue={filters.location?.type ?? "distance"}
            name="scope"
          >
            <option value="distance">Distance</option>
            <option value="city">City</option>
            <option value="region">Region</option>
            <option value="country">Country</option>
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-zinc-800">Radius</span>
          <select
            className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
            defaultValue={filters.radius ?? "infinite"}
            name="radius"
          >
            <option value="infinite">Any distance</option>
            <option value="100mi">100 miles</option>
            <option value="250mi">250 miles</option>
          </select>
        </label>
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

      <label className="flex items-center gap-2 text-sm font-medium text-zinc-800">
        <input
          className="size-4 rounded border-zinc-300 accent-orange-600"
          defaultChecked={filters.requireProfileImage ?? false}
          name="requireProfileImage"
          type="checkbox"
          value="1"
        />
        Require profile image
      </label>
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
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-zinc-800">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map(([value, text]) => (
          <label
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-700"
            key={value}
          >
            <input
              className="size-4 rounded border-zinc-300 accent-orange-600"
              defaultChecked={defaultValues?.includes(value)}
              name={name}
              type="checkbox"
              value={value}
            />
            {text}
          </label>
        ))}
      </div>
    </fieldset>
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
