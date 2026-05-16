import type { PrivacyVisibility } from "./types";

const VISIBILITY_LABELS: Record<string, string> = {
  public: "Public",
  liked: "Visible after like",
  friends: "Friends only",
  mutuals: "Mutuals only",
  private: "Private",
};

export function visibilityLabel(
  permission: PrivacyVisibility | null | undefined,
): string {
  if (!permission) {
    return "Restricted";
  }

  return VISIBILITY_LABELS[permission] ?? permission;
}
