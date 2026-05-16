import Link from "next/link";
import type { FeedMode, OverviewProfile } from "@/domain/barq/types";
import { choosePrimaryImage } from "@/domain/barq/images";
import { distanceLabel } from "@/domain/barq/normalize";
import { BarqImage } from "@/features/profile/barq-image";

export function ProfileCard({
  profile,
  mode,
  prefetch = false,
}: {
  profile: OverviewProfile;
  mode: FeedMode;
  prefetch?: boolean;
}) {
  const image = choosePrimaryImage(profile, mode);
  const distance = distanceLabel(profile.location?.distance);

  return (
    <Link
      className="group overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-ring/50 hover:shadow-md"
      href={`/profiles/${profile.uuid}?mode=${mode}`}
      prefetch={prefetch ? true : undefined}
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {image ? (
          <BarqImage
            alt={`${profile.displayName} profile image`}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            image={image}
            width={512}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted text-sm font-medium text-muted-foreground">
            No image
          </div>
        )}
      </div>
      <div className="space-y-3 p-4">
        <div>
          <h2 className="truncate text-base font-semibold">
            {profile.displayName}
          </h2>
          {profile.username ? (
            <p className="truncate text-sm text-muted-foreground">
              @{profile.username}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-medium">
          {distance ? (
            <span className="rounded-full bg-secondary px-2.5 py-1 text-secondary-foreground">
              {distance}
            </span>
          ) : null}
          {profile.relationType ? (
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">
              {profile.relationType}
            </span>
          ) : null}
          {profile.roles?.slice(0, 2).map((role) => (
            <span
              className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground"
              key={role}
            >
              {role}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
