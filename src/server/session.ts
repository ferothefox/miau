import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SESSION_COOKIE = "barq_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export type AppSession = {
  token: string;
  viewerId?: number;
};

type JwtPayload = {
  id?: unknown;
  token?: unknown;
  iat?: unknown;
};

export async function getSession(): Promise<AppSession | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  return {
    token,
    viewerId: decodeViewerId(token),
  };
}

export async function requireSession(): Promise<AppSession> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function setSession(token: string): Promise<void> {
  const cleanToken = token.trim();
  if (!cleanToken) {
    throw new Error("Missing session token.");
  }

  (await cookies()).set(SESSION_COOKIE, cleanToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

export function decodeViewerId(token: string): number | undefined {
  const payload = decodeJwtPayload(token);
  return typeof payload?.id === "number" && Number.isFinite(payload.id)
    ? payload.id
    : undefined;
}

function decodeJwtPayload(token: string): JwtPayload | null {
  const [, payload] = token.split(".");
  if (!payload) {
    return null;
  }

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as JwtPayload;
  } catch {
    return null;
  }
}
