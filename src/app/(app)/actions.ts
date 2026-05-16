"use server";

import { redirect } from "next/navigation";
import { clearBarqReadCacheForToken } from "@/server/barq/cached";
import { clearSession, getSession } from "@/server/session";

export async function logoutAction(): Promise<void> {
  const session = await getSession();
  if (session) {
    clearBarqReadCacheForToken(session.token);
  }

  await clearSession();
  redirect("/login");
}
