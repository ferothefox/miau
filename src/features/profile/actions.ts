"use server";

import { revalidatePath } from "next/cache";
import { clearBarqReadCacheForToken } from "@/server/barq/cached";
import { toClientSafeMessage } from "@/server/barq/errors";
import { likeProfile, unlikeProfile } from "@/server/barq/operations";
import { redirectToLoginOnAuthFailure } from "@/server/barq/redirects";
import { requireSession } from "@/server/session";

export type LikeActionResult = {
  ok: boolean;
  relationType?: string | null;
  error?: string;
};

export async function likeProfileAction(
  uuid: string,
): Promise<LikeActionResult> {
  return updateProfileLike(uuid, true);
}

export async function unlikeProfileAction(
  uuid: string,
): Promise<LikeActionResult> {
  return updateProfileLike(uuid, false);
}

async function updateProfileLike(
  uuid: string,
  liked: boolean,
): Promise<LikeActionResult> {
  if (!uuid.trim()) {
    return {
      ok: false,
      error: "Missing profile.",
    };
  }

  const session = await requireSession();

  try {
    if (liked) {
      await likeProfile(session.token, { uuid });
    } else {
      await unlikeProfile(session.token, { uuid });
    }

    clearBarqReadCacheForToken(session.token);
    revalidatePath("/feed");
    revalidatePath(`/profiles/${uuid}`);

    return {
      ok: true,
      relationType: liked ? "liked" : null,
    };
  } catch (error) {
    await redirectToLoginOnAuthFailure(error);
    return {
      ok: false,
      error: toClientSafeMessage(error),
    };
  }
}
