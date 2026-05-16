import "server-only";

import { normalizeNetworkError } from "./errors";

const BARQ_API_ORIGIN = "https://api.barq.app";

export async function requestEmailLoginCode(email: string): Promise<string> {
  return postEmailAuth<string>("/account-provider/email/request-code", {
    email,
  });
}

export async function loginWithEmailCode(
  email: string,
  code: string,
): Promise<string> {
  return postEmailAuth<string>("/account-provider/email/login", {
    email,
    code,
  });
}

async function postEmailAuth<TResponse>(
  path: string,
  body: object,
): Promise<TResponse> {
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
    return JSON.parse(text) as TResponse;
  } catch {
    return text as TResponse;
  }
}
