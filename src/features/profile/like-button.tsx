"use client";

import { useState, useTransition } from "react";
import type { RelationType } from "@/domain/barq/types";
import { likeProfileAction, unlikeProfileAction } from "./actions";

export function LikeButton({
  uuid,
  relationType,
}: {
  uuid: string;
  relationType: RelationType;
}) {
  const [currentRelation, setCurrentRelation] = useState<RelationType>(relationType);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const liked = isLiked(currentRelation);

  return (
    <div className="space-y-2">
      <button
        className={
          liked
            ? "h-11 rounded-lg border border-pink-200 bg-pink-50 px-4 text-sm font-semibold text-pink-700 transition hover:bg-pink-100 disabled:opacity-60"
            : "h-11 rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60"
        }
        disabled={pending}
        type="button"
        onClick={() => {
          const optimisticRelation = liked ? null : "liked";
          const previousRelation = currentRelation;
          setCurrentRelation(optimisticRelation);
          setError(null);

          startTransition(async () => {
            const result = liked
              ? await unlikeProfileAction(uuid)
              : await likeProfileAction(uuid);

            if (!result.ok) {
              setCurrentRelation(previousRelation);
              setError(result.error ?? "Could not update like.");
              return;
            }

            setCurrentRelation(result.relationType ?? null);
          });
        }}
      >
        {pending ? "Updating..." : liked ? "Unlike" : "Like"}
      </button>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}

function isLiked(relationType: RelationType): boolean {
  return relationType === "liked" || relationType === "mutual" || relationType === "friend";
}
