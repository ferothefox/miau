export type FeatureFlag = {
  id: string;
  title: string;
  description: string;
  enabledTargets: string[];
  __typename: "FeatureFlag";
};
