import "server-only";

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

  const body = await parseJsonSafely(response);

  if (!response.ok) {
    throw normalizeHttpError(response.status, body, operationName);
  }

  const payload = body as GraphQLResponse<TData>;

  if (payload.errors) {
    throw normalizeGraphQLErrors(payload.errors, operationName);
  }

  if (!payload.data) {
    throw new BarqUpstreamError({
      code: "UNKNOWN",
      message: "Barq returned an empty response.",
      operationName,
      raw: body,
    });
  }

  return payload.data;
}

async function parseJsonSafely(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
