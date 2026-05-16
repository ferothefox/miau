import "server-only";

import type { PlacesData, PlacesVariables } from "@/domain/barq/types";
import { barqGraphQL } from "../http";
import { PLACE_FRAGMENT } from "./fragments";

export const PLACES_QUERY = `
query Places($query: String!) {
  places(query: $query) {
    id
    country
    ...PlaceFragment
  }
}

${PLACE_FRAGMENT}
`;

export function places(token: string, variables: PlacesVariables): Promise<PlacesData> {
  return barqGraphQL<PlacesData, PlacesVariables>({
    token,
    operationName: "Places",
    query: PLACES_QUERY,
    variables,
  });
}
