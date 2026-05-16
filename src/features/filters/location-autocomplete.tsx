"use client";

import { useId, useMemo, useRef, useState, useTransition } from "react";
import { Combobox as BaseCombobox } from "@base-ui/react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxStatus,
} from "@/components/ui/combobox";
import type { Place } from "@/domain/barq/types";
import { isRecord } from "@/lib/type-guards";

export type SelectedLocation = {
  id?: string;
  label: string;
  latitude: number;
  longitude: number;
};

type LocationOption = SelectedLocation;
const MIN_PLACE_SEARCH_LENGTH = 3;

export function LocationAutocomplete({
  autoFocus = false,
  initialLocation,
  onClose,
  onSelect,
  variant = "field",
}: {
  autoFocus?: boolean;
  initialLocation?: SelectedLocation;
  onClose?: () => void;
  onSelect: (location: SelectedLocation | null) => void;
  variant?: "field" | "inline";
}) {
  const id = useId();
  const abortControllerRef = useRef<AbortController | null>(null);
  const popupPointerDownRef = useRef(false);
  const initialOption = useMemo(
    () =>
      initialLocation
        ? {
            ...initialLocation,
            id:
              initialLocation.id ??
              `${initialLocation.latitude}:${initialLocation.longitude}`,
          }
        : null,
    [initialLocation],
  );
  const committedValueRef = useRef<LocationOption | null>(initialOption);
  const pendingClearRef = useRef(false);
  const resultCacheRef = useRef(new Map<string, LocationOption[]>());
  const [searchResults, setSearchResults] = useState<LocationOption[]>(
    initialOption ? [initialOption] : [],
  );
  const [selectedValue, setSelectedValue] = useState<LocationOption | null>(
    initialOption,
  );
  const [searchValue, setSearchValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const trimmedSearchValue = searchValue.trim();
  const items = useMemo(() => {
    if (
      !selectedValue ||
      searchResults.some((result) =>
        isSameLocationOption(result, selectedValue),
      )
    ) {
      return searchResults;
    }

    return [...searchResults, selectedValue];
  }, [searchResults, selectedValue]);
  const status = getStatus({
    error,
    isPending,
    resultCount: searchResults.length,
    selectedValue,
    trimmedSearchValue,
  });
  const emptyMessage =
    trimmedSearchValue.length >= MIN_PLACE_SEARCH_LENGTH &&
    !isPending &&
    !error &&
    searchResults.length === 0
      ? "Try a different search term."
      : null;

  return (
    <Combobox
      items={items}
      value={selectedValue}
      filter={null}
      isItemEqualToValue={isSameLocationOption}
      itemToStringLabel={(option: LocationOption) => option.label}
      itemToStringValue={(option: LocationOption) => option.label}
      onOpenChangeComplete={(open) => {
        if (open) {
          return;
        }

        if (variant !== "inline") {
          onClose?.();
        }

        if (selectedValue) {
          setSearchResults([selectedValue]);
          return;
        }

        if (pendingClearRef.current) {
          pendingClearRef.current = false;
          if (committedValueRef.current) {
            setSelectedValue(committedValueRef.current);
            setSearchResults([committedValueRef.current]);
          }
          return;
        }

        if (committedValueRef.current) {
          setSelectedValue(committedValueRef.current);
          setSearchResults([committedValueRef.current]);
        }
      }}
      onValueChange={(nextSelectedValue, { reason }) => {
        setSelectedValue(nextSelectedValue);
        setSearchValue("");
        setError(null);

        if (nextSelectedValue) {
          pendingClearRef.current = false;
          committedValueRef.current = nextSelectedValue;
          setSearchResults([nextSelectedValue]);
          onSelect(nextSelectedValue);
        } else {
          setSearchResults([]);
          if (reason === "clear-press" || reason === "input-clear") {
            abortControllerRef.current?.abort();
            pendingClearRef.current = true;
          }
        }
      }}
      onInputValueChange={(nextSearchValue, { reason }) => {
        setSearchValue(nextSearchValue);

        if (reason === "item-press") {
          return;
        }

        const query = nextSearchValue.trim();
        if (!query) {
          abortControllerRef.current?.abort();
          pendingClearRef.current = true;
          setSearchResults([]);
          setError(null);
          return;
        }

        pendingClearRef.current = false;

        if (query.length < MIN_PLACE_SEARCH_LENGTH) {
          abortControllerRef.current?.abort();
          setSearchResults([]);
          setError(null);
          return;
        }

        const cacheKey = query.toLowerCase();
        const cachedResults = resultCacheRef.current.get(cacheKey);
        if (cachedResults) {
          setSearchResults(cachedResults);
          setError(null);
          return;
        }

        const controller = new AbortController();
        abortControllerRef.current?.abort();
        abortControllerRef.current = controller;

        startTransition(async () => {
          setError(null);
          const result = await searchPlaces(query, controller.signal);

          if (controller.signal.aborted) {
            return;
          }

          startTransition(() => {
            setSearchResults(result.places);
            if (!result.error) {
              resultCacheRef.current.set(cacheKey, result.places);
            }
            setError(result.error);
          });
        });
      }}
    >
      {variant === "inline" ? (
        <BaseCombobox.Input
          autoFocus={autoFocus}
          id={id}
          className="inline [field-sizing:content] h-[1em] max-w-full appearance-none border-0 bg-transparent p-0 font-[inherit] leading-[inherit] [letter-spacing:inherit] text-primary underline decoration-primary/30 decoration-2 underline-offset-4 outline-none placeholder:text-primary/45 focus-visible:ring-0"
          onBlur={() => {
            window.setTimeout(() => {
              if (!popupPointerDownRef.current) {
                onClose?.();
              }
            }, 0);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              onClose?.();
            }
          }}
          placeholder="Search city or place"
        />
      ) : (
        <ComboboxInput
          autoFocus={autoFocus}
          id={id}
          className="w-full"
          placeholder="Search city or place"
          showClear
          showTrigger
        />
      )}
      <ComboboxContent
        aria-busy={isPending || undefined}
        onPointerDownCapture={() => {
          popupPointerDownRef.current = true;
        }}
        onPointerUpCapture={() => {
          window.setTimeout(() => {
            popupPointerDownRef.current = false;
          }, 0);
        }}
      >
        {status ? (
          <ComboboxStatus className="px-1.5 py-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              {isPending ? (
                <span
                  aria-hidden
                  className="inline-block size-3 animate-spin rounded-full border border-current border-r-transparent"
                />
              ) : null}
              {status}
            </span>
          </ComboboxStatus>
        ) : null}
        {emptyMessage ? (
          <ComboboxEmpty className="justify-start px-1.5 py-1 text-left">
            {emptyMessage}
          </ComboboxEmpty>
        ) : null}
        <ComboboxList>
          {(option: LocationOption) => (
            <ComboboxItem key={option.id} value={option}>
              <span className="grid gap-0.5">
                <span>{option.label}</span>
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

function getStatus({
  error,
  isPending,
  resultCount,
  selectedValue,
  trimmedSearchValue,
}: {
  error: string | null;
  isPending: boolean;
  resultCount: number;
  selectedValue: LocationOption | null;
  trimmedSearchValue: string;
}) {
  if (isPending) {
    return "Searching...";
  }

  if (error) {
    return error;
  }

  if (!trimmedSearchValue) {
    return selectedValue ? null : "Start typing to search places...";
  }

  if (trimmedSearchValue.length < MIN_PLACE_SEARCH_LENGTH) {
    return "Type at least three characters.";
  }

  if (resultCount === 0) {
    return `No matches for "${trimmedSearchValue}".`;
  }

  return null;
}

async function searchPlaces(
  query: string,
  signal: AbortSignal,
): Promise<{ places: LocationOption[]; error: string | null }> {
  try {
    const response = await fetch(
      `/api/places?query=${encodeURIComponent(query)}`,
      {
        signal,
      },
    );

    if (!response.ok) {
      return { places: [], error: "Could not search places." };
    }

    const data: unknown = await response.json();
    const places = isPlacesResponse(data) ? data.places : [];

    return {
      places: places.slice(0, 8).map(optionFromPlace),
      error: null,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { places: [], error: null };
    }

    return { places: [], error: "Could not search places." };
  }
}

function optionFromPlace(place: Place): LocationOption {
  return {
    id: place.id,
    label: [place.place, place.region, place.countryCode]
      .filter(Boolean)
      .join(", "),
    latitude: place.latitude,
    longitude: place.longitude,
  };
}

function isPlacesResponse(value: unknown): value is { places: Place[] } {
  return (
    isRecord(value) &&
    Array.isArray(value.places) &&
    value.places.every(isPlace)
  );
}

function isPlace(value: unknown): value is Place {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.place === "string" &&
    (typeof value.region === "string" || value.region === null) &&
    typeof value.country === "string" &&
    typeof value.countryCode === "string" &&
    typeof value.longitude === "number" &&
    typeof value.latitude === "number" &&
    value.__typename === "Place"
  );
}

function isSameLocationOption(
  a: LocationOption | null,
  b: LocationOption | null,
) {
  if (!a || !b) {
    return a === b;
  }

  return a.id === b.id;
}
