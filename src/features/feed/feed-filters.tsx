"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconAdjustmentsHorizontal, IconSearch } from "@tabler/icons-react";
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

const FILTER_ROW_COUNT = 5;
const FILTER_EXIT_MS = 430;
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
  const [filtersMounted, setFiltersMounted] = useState(false);
  const [filtersAnimatingOpen, setFiltersAnimatingOpen] = useState(false);
  const [filterPanelHeight, setFilterPanelHeight] = useState("0px");
  const filterFrameRef = useRef(0);
  const filterPanelRef = useRef<HTMLDivElement | null>(null);
  const filterPanelContentRef = useRef<HTMLDivElement | null>(null);
  const filterUnmountTimerRef = useRef(0);
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

  useEffect(() => {
    return () => {
      if (filterFrameRef.current) {
        window.cancelAnimationFrame(filterFrameRef.current);
      }
      if (filterUnmountTimerRef.current) {
        window.clearTimeout(filterUnmountTimerRef.current);
      }
    };
  }, []);

  function setFilterPanelOpen(open: boolean) {
    if (filterFrameRef.current) {
      window.cancelAnimationFrame(filterFrameRef.current);
      filterFrameRef.current = 0;
    }
    if (filterUnmountTimerRef.current) {
      window.clearTimeout(filterUnmountTimerRef.current);
      filterUnmountTimerRef.current = 0;
    }

    setFiltersOpen(open);

    if (open) {
      setFiltersMounted(true);
      setFiltersAnimatingOpen(false);
      setFilterPanelHeight(`${filterPanelRef.current?.offsetHeight ?? 0}px`);
      filterFrameRef.current = window.requestAnimationFrame(() => {
        setFilterPanelHeight(
          `${filterPanelContentRef.current?.scrollHeight ?? 0}px`,
        );
        setFiltersAnimatingOpen(true);
        filterFrameRef.current = 0;
      });
      return;
    }

    setFilterPanelHeight(`${filterPanelRef.current?.offsetHeight ?? 0}px`);
    setFiltersAnimatingOpen(false);
    filterFrameRef.current = window.requestAnimationFrame(() => {
      setFilterPanelHeight("0px");
      filterFrameRef.current = 0;
    });
    filterUnmountTimerRef.current = window.setTimeout(() => {
      setFiltersMounted(false);
      setFilterPanelHeight("0px");
      filterUnmountTimerRef.current = 0;
    }, FILTER_EXIT_MS);
  }

  return (
    <section>
      <div>
        <h1 className="max-w-4xl text-4xl leading-[1.05] font-bold tracking-tight text-balance sm:text-5xl">
          <span className="block">Hi {viewerName}!</span>
          <span className="block">
            You&apos;re in{" "}
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
      </div>

      <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <InputGroup className="h-11 bg-background/70 lg:max-w-md [&>input]:pr-3 [&>input]:pl-2">
          <InputGroupAddon align="inline-start" className="pl-3">
            <IconSearch className="size-5" />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Search by display name"
            className="text-base md:text-base"
            name="displayName"
            placeholder="Find anyone"
            type="search"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </InputGroup>

        <div className="flex flex-wrap items-center gap-2">
          {(["sfw", "nsfw"] as const).map((value) => (
            <Button
              key={value}
              className="h-11 px-4 text-base"
              size="lg"
              type="button"
              variant={draftMode === value ? "default" : "outline"}
              aria-pressed={draftMode === value}
              onClick={() => setDraftMode(value)}
            >
              {value.toUpperCase()}
            </Button>
          ))}
          <Button
            aria-expanded={filtersOpen}
            className="h-11 gap-2 px-4 text-base has-data-[icon=inline-start]:pr-4 has-data-[icon=inline-start]:pl-3.5"
            size="lg"
            type="button"
            variant="secondary"
            onClick={() => setFilterPanelOpen(!filtersOpen)}
          >
            <IconAdjustmentsHorizontal
              className="size-5"
              data-icon="inline-start"
            />
            Filter out the fluff
          </Button>
        </div>
      </div>

      {filtersMounted ? (
        <div
          ref={filterPanelRef}
          aria-hidden={!filtersOpen}
          data-state={filtersAnimatingOpen ? "open" : "closed"}
          className="overflow-hidden transition-[height,opacity] duration-[380ms] ease-[cubic-bezier(0.16,1,0.3,1)] data-[state=closed]:pointer-events-none data-[state=closed]:opacity-0 data-[state=open]:opacity-100 motion-reduce:transition-none"
          style={{ height: filterPanelHeight }}
          onTransitionEnd={(event) => {
            if (event.target !== event.currentTarget) {
              return;
            }

            if (event.propertyName !== "height") {
              return;
            }

            if (filtersOpen) {
              return;
            }

            if (filterUnmountTimerRef.current) {
              window.clearTimeout(filterUnmountTimerRef.current);
              filterUnmountTimerRef.current = 0;
            }
            setFiltersMounted(false);
            setFilterPanelHeight("0px");
          }}
        >
          <div
            ref={filterPanelContentRef}
            className="min-h-0 overflow-hidden pt-5"
          >
            <ItemGroup className="gap-0 divide-y divide-border/70">
              <FilterItem
                index={0}
                open={filtersAnimatingOpen}
                phase={filterItemPhase(filtersOpen, filtersAnimatingOpen)}
                title="Gender"
              >
                {GENDERS.map((gender) => (
                  <ToggleButton
                    key={gender}
                    active={genders.includes(gender)}
                    onClick={() =>
                      setGenders((values) =>
                        toggleListValue(
                          values,
                          gender,
                          !values.includes(gender),
                        ),
                      )
                    }
                  >
                    {gender}
                  </ToggleButton>
                ))}
              </FilterItem>

              <FilterItem
                index={1}
                open={filtersAnimatingOpen}
                phase={filterItemPhase(filtersOpen, filtersAnimatingOpen)}
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

              <FilterItem
                index={2}
                open={filtersAnimatingOpen}
                phase={filterItemPhase(filtersOpen, filtersAnimatingOpen)}
                title="Age"
              >
                <InputGroup className="h-7 w-24">
                  <InputGroupAddon align="inline-start" className="py-0">
                    <InputGroupText className="text-[0.8rem]">
                      Min
                    </InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    aria-label="Minimum age"
                    className="h-7 text-[0.8rem] md:text-[0.8rem]"
                    min={18}
                    type="number"
                    value={ageMin}
                    onChange={(event) => setAgeMin(event.target.value)}
                  />
                </InputGroup>
                <span className="flex h-7 items-center text-sm text-muted-foreground">
                  to
                </span>
                <InputGroup className="h-7 w-24">
                  <InputGroupAddon align="inline-start" className="py-0">
                    <InputGroupText className="text-[0.8rem]">
                      Max
                    </InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    aria-label="Maximum age"
                    className="h-7 text-[0.8rem] md:text-[0.8rem]"
                    min={18}
                    type="number"
                    value={ageMax}
                    onChange={(event) => setAgeMax(event.target.value)}
                  />
                </InputGroup>
              </FilterItem>

              <FilterItem
                index={3}
                open={filtersAnimatingOpen}
                phase={filterItemPhase(filtersOpen, filtersAnimatingOpen)}
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
                index={4}
                open={filtersAnimatingOpen}
                phase={filterItemPhase(filtersOpen, filtersAnimatingOpen)}
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
          </div>
        </div>
      ) : null}
    </section>
  );
}

function FilterItem({
  children,
  description,
  index,
  open,
  phase,
  title,
}: {
  children: ReactNode;
  description?: string;
  index: number;
  open: boolean;
  phase: "closing" | "open" | "opening";
  title: string;
}) {
  const delay = open ? 55 + index * 34 : (FILTER_ROW_COUNT - index - 1) * 22;

  return (
    <Item
      data-state={phase}
      style={{
        transitionDelay: `${delay}ms`,
        transitionDuration: open ? "520ms" : "230ms",
        transitionTimingFunction: open
          ? "cubic-bezier(0.16, 1, 0.3, 1)"
          : "cubic-bezier(0.4, 0, 1, 1)",
      }}
      className="flex-col items-start rounded-none border-0 px-0 py-4 transition-[opacity,transform] will-change-transform data-[state=closing]:translate-y-0 data-[state=closing]:opacity-0 data-[state=open]:translate-y-0 data-[state=open]:opacity-100 data-[state=opening]:translate-y-3 data-[state=opening]:opacity-0 motion-reduce:transition-none sm:flex-row"
    >
      <ItemContent className="w-full sm:w-64 sm:flex-none">
        <ItemTitle>{title}</ItemTitle>
        {description ? <ItemDescription>{description}</ItemDescription> : null}
      </ItemContent>
      <ItemActions className="flex w-full flex-wrap justify-start gap-2 sm:ml-auto sm:w-auto sm:flex-1 sm:justify-end">
        {children}
      </ItemActions>
    </Item>
  );
}

function filterItemPhase(
  open: boolean,
  animatingOpen: boolean,
): "closing" | "open" | "opening" {
  if (animatingOpen) {
    return "open";
  }

  return open ? "opening" : "closing";
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
