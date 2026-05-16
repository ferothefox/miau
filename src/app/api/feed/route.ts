import { NextResponse } from "next/server";
import {
  clampProfileLimit,
  nextCursor,
  parseFeedFilters,
  parseFeedMode,
  type SearchParamRecord,
} from "@/domain/barq/filters";
import {
  DEFAULT_PROFILE_LIMIT,
  type FeedPageResponse,
} from "@/domain/barq/types";
import { isBarqAuthError, toClientSafeMessage } from "@/server/barq/errors";
import {
  clearBarqReadCacheForToken,
  getProfileSearchPage,
} from "@/server/barq/cached";
import { clearSession, getSession } from "@/server/session";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = new URL(request.url).searchParams;
  const paramRecord: SearchParamRecord = {};
  for (const [key, value] of searchParams) {
    paramRecord[key] = value;
  }

  const mode = parseFeedMode(paramRecord);
  const filters = parseFeedFilters(paramRecord);
  const cursor = searchParams.get("cursor") ?? "";
  const limitParam = searchParams.get("limit");
  const limit = clampProfileLimit(
    limitParam ? Number(limitParam) : DEFAULT_PROFILE_LIMIT,
  );

  try {
    const data = await getProfileSearchPage(
      session.token,
      mode,
      filters,
      cursor,
      limit,
    );
    const response: FeedPageResponse = {
      profiles: data.profileSearch,
      cursor: nextCursor(cursor, data.profileSearch.length),
      hasMore: data.profileSearch.length >= limit,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (isBarqAuthError(error)) {
      clearBarqReadCacheForToken(session.token);
      await clearSession();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: toClientSafeMessage(error) },
      { status: 502 },
    );
  }
}
