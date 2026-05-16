import type { PrivacyVisibility, ProfileSocialAccount } from "./types";

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

export function canRenderSocialValue(account: ProfileSocialAccount): boolean {
  return (
    account.accessPermission === "public" &&
    Boolean(account.url || account.value || account.displayName)
  );
}

export function socialDisplayValue(account: ProfileSocialAccount): string {
  return (
    account.displayName ||
    account.value ||
    account.url ||
    visibilityLabel(account.accessPermission)
  );
}
