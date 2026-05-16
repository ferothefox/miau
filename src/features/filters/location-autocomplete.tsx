"use client";

import { useEffect, useRef, useState } from "react";
import type { Place } from "@/domain/barq/types";

export type SelectedLocation = {
  label: string;
  latitude: number;
  longitude: number;
};

export function LocationAutocomplete({
  initialLocation,
  onSelect,
}: {
  initialLocation?: SelectedLocation;
  onSelect: (location: SelectedLocation | null) => void;
}) {
  const [query, setQuery] = useState(initialLocation?.label ?? "");
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const selectedLabel = useRef(initialLocation?.label ?? "");

  useEffect(() => {
    if (query.trim().length < 2 || query === selectedLabel.current) {
      setPlaces([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/places?query=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          setPlaces([]);
          return;
        }
        const data = (await response.json()) as { places: Place[] };
        setPlaces(data.places);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setPlaces([]);
        }
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  return (
    <div className="relative">
      <input
        className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
        placeholder="Search city or place"
        type="search"
        value={query}
        onChange={(event) => {
          selectedLabel.current = "";
          setQuery(event.target.value);
          onSelect(null);
        }}
      />
      {(places.length > 0 || loading) && (
        <div className="absolute left-0 right-0 top-11 z-20 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xl">
          {loading ? (
            <p className="px-3 py-2 text-sm text-zinc-500">Searching...</p>
          ) : (
            places.slice(0, 8).map((place) => {
              const label = [place.place, place.region, place.countryCode]
                .filter(Boolean)
                .join(", ");

              return (
                <button
                  className="block w-full px-3 py-2 text-left text-sm text-zinc-800 transition hover:bg-orange-50"
                  key={place.id}
                  type="button"
                  onClick={() => {
                    selectedLabel.current = label;
                    setQuery(label);
                    setPlaces([]);
                    onSelect({
                      label,
                      latitude: place.latitude,
                      longitude: place.longitude,
                    });
                  }}
                >
                  {label}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
