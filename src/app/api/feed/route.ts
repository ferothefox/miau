import { NextResponse } from "next/server";
import {
  clampProfileLimit,
  nextCursor,
  parseFeedFilters,
  parseFeedMode,
  type SearchParamRecord,
} from "@/domain/barq/filters";
import { DEFAULT_PROFILE_LIMIT } from "@/domain/barq/types";
import { isBarqAuthError, toClientSafeMessage } from "@/server/barq/errors";
import {
  clearBarqReadCacheForToken,
  getProfileSearchPage,
} from "@/server/barq/cached";
import { clearSession, getSession } from "@/server/session";
import type { FeedPageResponse } from "@/features/feed/types";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = new URL(request.url).searchParams;
  const paramRecord = toSearchParamRecord(searchParams);
  const mode = parseFeedMode(paramRecord);
  const filters = parseFeedFilters(paramRecord);
  const cursor = searchParams.get("cursor") ?? "";
  const limit = clampProfileLimit(
    numberSearchParam(searchParams, "limit") ?? DEFAULT_PROFILE_LIMIT,
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

function toSearchParamRecord(searchParams: URLSearchParams): SearchParamRecord {
  const record: SearchParamRecord = {};

  for (const [key, value] of searchParams) {
    record[key] = value;
  }

  return record;
}

function numberSearchParam(
  searchParams: URLSearchParams,
  key: string,
): number | undefined {
  const value = searchParams.get(key);
  if (!value) {
    return undefined;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}
