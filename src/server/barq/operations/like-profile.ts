import "server-only";

import type { LikeProfileData, LikeProfileVariables } from "@/domain/barq/types";
import { barqGraphQL } from "../http";

export const LIKE_PROFILE_MUTATION = `
mutation LikeProfile($uuid: String!) {
  likeProfile(uuid: $uuid)
}
`;

export function likeProfile(
  token: string,
  variables: LikeProfileVariables,
): Promise<LikeProfileData> {
  return barqGraphQL<LikeProfileData, LikeProfileVariables>({
    token,
    operationName: "LikeProfile",
    query: LIKE_PROFILE_MUTATION,
    variables,
  });
}
