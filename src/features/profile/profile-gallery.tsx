"use client";

import { useMemo, useState } from "react";
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
      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-zinc-950">Images</h2>
        <p className="mt-2 text-sm text-zinc-500">No gallery images are available.</p>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
      <div>
        <h2 className="text-lg font-semibold text-zinc-950">Images</h2>
        <p className="text-sm text-zinc-500">
          {groups.visible.length} visible, {groups.locked.length} locked
        </p>
      </div>

      {selected?.image ? (
        <div className="overflow-hidden rounded-xl bg-zinc-100">
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
          <button
            className={
              profileImage.id === selected?.id
                ? "aspect-square overflow-hidden rounded-lg ring-2 ring-orange-500"
                : "aspect-square overflow-hidden rounded-lg ring-1 ring-zinc-200"
            }
            key={profileImage.id}
            type="button"
            onClick={() => setSelectedId(profileImage.id)}
          >
            <BarqImage
              alt="Profile thumbnail"
              className="h-full w-full object-cover"
              image={profileImage.image}
              width={240}
            />
          </button>
        ))}
        {groups.locked.map((profileImage) => (
          <div
            className="flex aspect-square items-center justify-center rounded-lg bg-zinc-100 p-2 text-center text-xs font-medium text-zinc-500 ring-1 ring-zinc-200"
            key={profileImage.id}
          >
            {visibilityLabel(profileImage.accessPermission)}
          </div>
        ))}
      </div>
    </section>
  );
}
