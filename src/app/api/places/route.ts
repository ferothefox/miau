import { NextResponse } from "next/server";
import { isBarqAuthError, toClientSafeMessage } from "@/server/barq/errors";
import { places } from "@/server/barq/operations";
import { clearSession, getSession } from "@/server/session";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = new URL(request.url).searchParams.get("query")?.trim() ?? "";
  if (query.length < 3) {
    return NextResponse.json({ places: [] });
  }

  try {
    const data = await places(session.token, { query });
    return NextResponse.json({ places: data.places });
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
