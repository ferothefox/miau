import "server-only";

import { normalizeNetworkError } from "./errors";

const BARQ_API_ORIGIN = "https://api.barq.app";

export async function requestEmailLoginCode(email: string): Promise<string> {
  return postEmailAuthString("/account-provider/email/request-code", {
    email,
  });
}

export async function loginWithEmailCode(
  email: string,
  code: string,
): Promise<string> {
  return postEmailAuthString("/account-provider/email/login", {
    email,
    code,
  });
}

async function postEmailAuthString(
  path: string,
  body: object,
): Promise<string> {
  let response: Response;

  try {
    response = await fetch(`${BARQ_API_ORIGIN}${path}`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "content-type": "application/json",
        origin: "https://web.barq.app",
        referer: "https://web.barq.app/",
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw normalizeNetworkError(error);
  }

  if (!response.ok) {
    throw new Error("Email authentication failed.");
  }

  const text = await response.text();

  try {
    const parsed: unknown = JSON.parse(text);
    return typeof parsed === "string" ? parsed : text;
  } catch {
    return text;
  }
}
