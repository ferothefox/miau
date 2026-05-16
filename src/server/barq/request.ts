const BARQ_WEB_ORIGIN = "https://web.barq.app";

export type GraphQLRequest<TVariables> = {
  token: string;
  operationName: string;
  query: string;
  variables: TVariables;
};

export function buildGraphQLRequestInit<TVariables>({
  token,
  operationName,
  query,
  variables,
}: GraphQLRequest<TVariables>): RequestInit {
  return {
    method: "POST",
    cache: "no-store",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      origin: BARQ_WEB_ORIGIN,
      referer: `${BARQ_WEB_ORIGIN}/`,
    },
    body: JSON.stringify({
      operationName,
      variables,
      query,
    }),
  };
}
