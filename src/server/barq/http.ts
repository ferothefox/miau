import "server-only";

import { isRecord } from "@/lib/type-guards";
import {
  BarqUpstreamError,
  normalizeGraphQLErrors,
  normalizeHttpError,
  normalizeNetworkError,
} from "./errors";
import { buildGraphQLRequestInit, type GraphQLRequest } from "./request";

const BARQ_API_ORIGIN = "https://api.barq.app";
const GRAPHQL_URL = `${BARQ_API_ORIGIN}/graphql`;

type GraphQLResponse<TData> = {
  data?: TData;
  errors?: unknown;
};

export async function barqGraphQL<TData, TVariables>({
  token,
  operationName,
  query,
  variables,
}: GraphQLRequest<TVariables>): Promise<TData> {
  let response: Response;

  try {
    response = await fetch(
      GRAPHQL_URL,
      buildGraphQLRequestInit({ token, operationName, query, variables }),
    );
  } catch (error) {
    throw normalizeNetworkError(error, operationName);
  }

  const body = await parseJsonSafely<TData>(response);

  if (!response.ok) {
    throw normalizeHttpError(response.status, body, operationName);
  }

  if (!body) {
    throw new BarqUpstreamError({
      code: "UNKNOWN",
      message: "Barq returned an empty response.",
      operationName,
    });
  }

  if (body.errors) {
    throw normalizeGraphQLErrors(body.errors, operationName);
  }

  if (!body.data) {
    throw new BarqUpstreamError({
      code: "UNKNOWN",
      message: "Barq returned an empty response.",
      operationName,
      raw: body,
    });
  }

  return body.data;
}

async function parseJsonSafely<TData>(
  response: Response,
): Promise<GraphQLResponse<TData> | null> {
  try {
    const body: unknown = await response.json();
    return isGraphQLResponse<TData>(body) ? body : null;
  } catch {
    return null;
  }
}

function isGraphQLResponse<TData>(
  value: unknown,
): value is GraphQLResponse<TData> {
  return isRecord(value);
}
