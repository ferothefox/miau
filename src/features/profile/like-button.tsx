"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
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
      <Button
        className="h-11 px-4"
        disabled={pending}
        type="button"
        variant={liked ? "outline" : "default"}
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
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function isLiked(relationType: RelationType): boolean {
  return relationType === "liked" || relationType === "mutual" || relationType === "friend";
}
