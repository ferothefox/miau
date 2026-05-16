import "server-only";

import { redirect } from "next/navigation";
import { clearSession } from "../session";
import { isBarqAuthError } from "./errors";

export async function redirectToLoginOnAuthFailure(
  error: unknown,
): Promise<never> {
  if (isBarqAuthError(error)) {
    await clearSession();
    redirect("/login");
  }

  throw error;
}
