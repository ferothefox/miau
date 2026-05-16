"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
        const response = await fetch(
          `/api/places?query=${encodeURIComponent(query)}`,
          {
            signal: controller.signal,
          },
        );
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
      <Input
        placeholder="Search city or place"
        type="search"
        value={query}
        onChange={(event) => {
          selectedLabel.current = "";
          setQuery(event.target.value);
          if (!event.target.value.trim()) {
            onSelect(null);
          }
        }}
      />
      {(places.length > 0 || loading) && (
        <div className="absolute mt-2 grid w-full gap-1 bg-popover p-1">
          {loading ? (
            <p className="text-sm text-muted-foreground">Searching...</p>
          ) : (
            places.slice(0, 8).map((place) => {
              const label = [place.place, place.region, place.countryCode]
                .filter(Boolean)
                .join(", ");

              return (
                <Button
                  key={place.id}
                  type="button"
                  variant="ghost"
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
                </Button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
