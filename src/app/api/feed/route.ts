import { NextResponse } from "next/server";
import {
  clampProfileLimit,
  nextCursor,
  normalizeFeedFilters,
} from "@/domain/barq/filters";
import { DEFAULT_PROFILE_LIMIT, type FeedMode } from "@/domain/barq/types";
import { isBarqAuthError, toClientSafeMessage } from "@/server/barq/errors";
import { profileSearch } from "@/server/barq/operations";
import { clearSession, getSession } from "@/server/session";
import type { FeedPagePayload, FeedPageResponse } from "@/features/feed/types";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: Partial<FeedPagePayload>;
  try {
    payload = (await request.json()) as Partial<FeedPagePayload>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const mode: FeedMode = payload.mode === "nsfw" ? "nsfw" : "sfw";
  const filters = normalizeFeedFilters(payload.filters ?? {});
  const cursor = typeof payload.cursor === "string" ? payload.cursor : "";
  const limit = clampProfileLimit(payload.limit ?? DEFAULT_PROFILE_LIMIT);

  try {
    const data = await profileSearch({
      token: session.token,
      mode,
      filters,
      cursor,
      limit,
    });
    const response: FeedPageResponse = {
      profiles: data.profileSearch,
      cursor: nextCursor(cursor, data.profileSearch.length),
      hasMore: data.profileSearch.length >= limit,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (isBarqAuthError(error)) {
      await clearSession();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: toClientSafeMessage(error) },
      { status: 502 },
    );
  }
}
