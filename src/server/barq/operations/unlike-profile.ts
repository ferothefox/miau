import "server-only";

import type {
  LikeProfileVariables,
  UnlikeProfileData,
} from "@/domain/barq/types";
import { barqGraphQL } from "../http";

export const UNLIKE_PROFILE_MUTATION = `
mutation UnlikeProfile($uuid: String!) {
  unlikeProfile(uuid: $uuid)
}
`;

export function unlikeProfile(
  token: string,
  variables: LikeProfileVariables,
): Promise<UnlikeProfileData> {
  return barqGraphQL<UnlikeProfileData, LikeProfileVariables>({
    token,
    operationName: "UnlikeProfile",
    query: UNLIKE_PROFILE_MUTATION,
    variables,
  });
}
