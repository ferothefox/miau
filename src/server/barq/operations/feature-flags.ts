import "server-only";

import type { FeatureFlagsData } from "@/domain/barq/types";
import { barqGraphQL } from "../http";

export const FEATURE_FLAGS_QUERY = `
query FeatureFlags {
  featureFlags {
    id
    title
    description
    enabledTargets
    __typename
  }
}
`;

export function featureFlags(token: string): Promise<FeatureFlagsData> {
  return barqGraphQL<FeatureFlagsData, Record<string, never>>({
    token,
    operationName: "FeatureFlags",
    query: FEATURE_FLAGS_QUERY,
    variables: {},
  });
}
