"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ProfileImage } from "@/domain/barq/types";
import { splitProfileImages } from "@/domain/barq/normalize";
import { visibilityLabel } from "@/domain/barq/permissions";
import { BarqImage } from "./barq-image";

export function ProfileGallery({ images }: { images: ProfileImage[] }) {
  const groups = useMemo(() => splitProfileImages(images), [images]);
  const [selectedId, setSelectedId] = useState(groups.visible[0]?.id ?? null);
  const selected = groups.visible.find((image) => image.id === selectedId) ?? groups.visible[0];

  if (groups.visible.length === 0 && groups.locked.length === 0) {
    return (
      <section className="rounded-xl border border-border bg-card p-5 text-card-foreground">
        <h2 className="text-lg font-semibold">Images</h2>
        <p className="mt-2 text-sm text-muted-foreground">No gallery images are available.</p>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-5 text-card-foreground">
      <div>
        <h2 className="text-lg font-semibold">Images</h2>
        <p className="text-sm text-muted-foreground">
          {groups.visible.length} visible, {groups.locked.length} locked
        </p>
      </div>

      {selected?.image ? (
        <div className="overflow-hidden rounded-xl bg-muted">
          <BarqImage
            alt="Selected profile image"
            className="max-h-[720px] w-full object-contain"
            image={selected.image}
            width={1200}
            priority
          />
        </div>
      ) : null}

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
        {groups.visible.map((profileImage) => (
          <Button
            className={
              profileImage.id === selected?.id
                ? "h-auto aspect-square overflow-hidden rounded-lg p-0 ring-2 ring-ring"
                : "h-auto aspect-square overflow-hidden rounded-lg p-0 ring-1 ring-border"
            }
            key={profileImage.id}
            type="button"
            variant="ghost"
            onClick={() => setSelectedId(profileImage.id)}
          >
            <BarqImage
              alt="Profile thumbnail"
              className="h-full w-full object-cover"
              image={profileImage.image}
              width={240}
            />
          </Button>
        ))}
        {groups.locked.map((profileImage) => (
          <div
            className="flex aspect-square items-center justify-center rounded-lg bg-muted p-2 text-center text-xs font-medium text-muted-foreground ring-1 ring-border"
            key={profileImage.id}
          >
            {visibilityLabel(profileImage.accessPermission)}
          </div>
        ))}
      </div>
    </section>
  );
}
