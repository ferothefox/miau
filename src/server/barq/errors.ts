export type BarqErrorCode =
  | "AUTH_MISSING"
  | "AUTH_INVALID"
  | "AUTH_SIGNATURE_INVALID"
  | "GRAPHQL_ERROR"
  | "HTTP_ERROR"
  | "NETWORK_ERROR"
  | "UNKNOWN";

export type BarqClientError = {
  code: BarqErrorCode;
  message: string;
  status?: number;
  operationName?: string;
  raw?: unknown;
};

export class BarqUpstreamError extends Error {
  readonly code: BarqErrorCode;
  readonly status?: number;
  readonly operationName?: string;
  readonly raw?: unknown;

  constructor(error: BarqClientError) {
    super(error.message);
    this.name = "BarqUpstreamError";
    this.code = error.code;
    this.status = error.status;
    this.operationName = error.operationName;
    this.raw = error.raw;
  }
}

export function isBarqClientError(error: unknown): error is BarqUpstreamError {
  return error instanceof BarqUpstreamError;
}

export function isBarqAuthError(error: unknown): boolean {
  return (
    error instanceof BarqUpstreamError &&
    (error.code === "AUTH_MISSING" ||
      error.code === "AUTH_INVALID" ||
      error.code === "AUTH_SIGNATURE_INVALID")
  );
}

export function toClientSafeMessage(error: unknown): string {
  if (error instanceof BarqUpstreamError) {
    if (isBarqAuthError(error)) {
      return "Your session expired. Sign in again.";
    }

    return error.message;
  }

  return "The upstream service could not be reached.";
}

export function normalizeGraphQLErrors(
  errors: unknown,
  operationName: string,
): BarqUpstreamError {
  const code = detectAuthErrorCode(errors) ?? "GRAPHQL_ERROR";
  return new BarqUpstreamError({
    code,
    message: clientSafeMessageForCode(code),
    operationName,
    raw: errors,
  });
}

export function normalizeHttpError(
  status: number,
  body: unknown,
  operationName: string,
): BarqUpstreamError {
  const code = detectAuthErrorCode(body) ?? "HTTP_ERROR";
  return new BarqUpstreamError({
    code,
    message: clientSafeMessageForCode(code),
    status,
    operationName,
    raw: body,
  });
}

export function normalizeNetworkError(
  error: unknown,
  operationName?: string,
): BarqUpstreamError {
  return new BarqUpstreamError({
    code: "NETWORK_ERROR",
    message: "Barq is temporarily unreachable. Try again shortly.",
    operationName,
    raw: error,
  });
}

export function detectAuthErrorCode(value: unknown): BarqErrorCode | null {
  const serialized = JSON.stringify(value);
  const text = serialized?.toLowerCase() ?? "";

  if (!text) {
    return null;
  }

  if (text.includes("invalid signature")) {
    return "AUTH_SIGNATURE_INVALID";
  }

  if (text.includes("token invalid") || text.includes("unauthenticated")) {
    return "AUTH_INVALID";
  }

  if (
    text.includes("split") ||
    text.includes("missing auth") ||
    text.includes("authorization")
  ) {
    return "AUTH_MISSING";
  }

  return null;
}

function clientSafeMessageForCode(code: BarqErrorCode): string {
  switch (code) {
    case "AUTH_MISSING":
    case "AUTH_INVALID":
    case "AUTH_SIGNATURE_INVALID":
      return "Your session expired. Sign in again.";
    case "HTTP_ERROR":
      return "Barq returned an unexpected HTTP response.";
    case "NETWORK_ERROR":
      return "Barq is temporarily unreachable. Try again shortly.";
    case "GRAPHQL_ERROR":
      return "Barq returned an unexpected GraphQL response.";
    case "UNKNOWN":
      return "Barq returned an unexpected response.";
  }
}
