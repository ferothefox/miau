import Link from "next/link";
import type { FeedMode, OverviewProfile } from "@/domain/barq/types";
import { choosePrimaryImage } from "@/domain/barq/images";
import { distanceLabel } from "@/domain/barq/normalize";
import { BarqImage } from "@/features/profile/barq-image";

export function ProfileCard({
  profile,
  mode,
}: {
  profile: OverviewProfile;
  mode: FeedMode;
}) {
  const image = choosePrimaryImage(profile, mode);
  const distance = distanceLabel(profile.location?.distance);

  return (
    <Link
      className="group overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
      href={`/profiles/${profile.uuid}?mode=${mode}`}
    >
      <div className="relative aspect-square overflow-hidden bg-zinc-100">
        {image ? (
          <BarqImage
            alt={`${profile.displayName} profile image`}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            image={image}
            width={512}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-sm font-medium text-zinc-500">
            No image
          </div>
        )}
      </div>
      <div className="space-y-3 p-4">
        <div>
          <h2 className="truncate text-base font-semibold text-zinc-950">
            {profile.displayName}
          </h2>
          {profile.username ? (
            <p className="truncate text-sm text-zinc-500">@{profile.username}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-medium">
          {distance ? (
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-zinc-700">
              {distance}
            </span>
          ) : null}
          {profile.relationType ? (
            <span className="rounded-full bg-pink-50 px-2.5 py-1 text-pink-700">
              {profile.relationType}
            </span>
          ) : null}
          {profile.roles?.slice(0, 2).map((role) => (
            <span className="rounded-full bg-orange-50 px-2.5 py-1 text-orange-700" key={role}>
              {role}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
