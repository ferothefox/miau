import { notFound } from "next/navigation";
import { chooseHeaderImage, choosePrimaryImage } from "@/domain/barq/images";
import {
  distanceLabel,
  groupKinksByCategory,
  hydrateSonaImages,
  normalizeProfileDetail,
} from "@/domain/barq/normalize";
import { parseFeedMode, type SearchParamRecord } from "@/domain/barq/filters";
import {
  canRenderSocialValue,
  socialDisplayValue,
  visibilityLabel,
} from "@/domain/barq/permissions";
import type {
  ProfileBio,
  ProfileBioAd,
  ProfileDetail,
  Sona,
} from "@/domain/barq/types";
import { profileDetail } from "@/server/barq/operations";
import { redirectToLoginOnAuthFailure } from "@/server/barq/redirects";
import { requireSession } from "@/server/session";
import { BarqImage } from "@/features/profile/barq-image";
import { LikeButton } from "@/features/profile/like-button";
import { ProfileGallery } from "@/features/profile/profile-gallery";

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ uuid: string }>;
  searchParams: Promise<SearchParamRecord>;
}) {
  const [{ uuid }, query] = await Promise.all([params, searchParams]);
  const mode = parseFeedMode(query);
  const session = await requireSession();
  const data = await profileDetail(session.token, { uuid }).catch(
    redirectToLoginOnAuthFailure,
  );

  if (!data.profile) {
    notFound();
  }

  const profile = normalizeProfileDetail(data.profile);
  const primaryImage = choosePrimaryImage(profile, mode);
  const headerImage = chooseHeaderImage(profile, mode);
  const hydratedSonas = hydrateSonaImages(profile);
  const kinkGroups = groupKinksByCategory(profile.kinks);
  const location = locationLabel(profile);

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6">
      <section className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm">
        <div className="relative z-0 h-56 bg-muted sm:h-72">
          {headerImage ? (
            <BarqImage
              alt={`${profile.displayName} header image`}
              className="h-full w-full object-cover"
              image={headerImage}
              width={1400}
              priority
            />
          ) : (
            <div className="h-full w-full bg-[linear-gradient(135deg,var(--primary),var(--muted))]" />
          )}
        </div>
        <div className="relative z-10 grid gap-5 p-5 md:grid-cols-[180px_1fr_auto] md:items-end">
          <div className="relative z-20 -mt-24 aspect-square overflow-hidden rounded-xl border-4 border-card bg-muted shadow-sm md:-mt-28">
            {primaryImage ? (
              <BarqImage
                alt={`${profile.displayName} profile image`}
                className="h-full w-full object-cover"
                image={primaryImage}
                width={480}
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-medium text-muted-foreground">
                No image
              </div>
            )}
          </div>
          <div className="space-y-3">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                {profile.displayName}
              </h1>
              <p className="text-sm text-muted-foreground">
                {[
                  profile.username ? `@${profile.username}` : null,
                  profile.age ? `${profile.age}` : null,
                  location,
                ]
                  .filter(Boolean)
                  .join(" / ")}
              </p>
            </div>
            <BadgeList
              values={[
                profile.relationType ?? undefined,
                ...(profile.roles ?? []),
              ]}
            />
          </div>
          <LikeButton relationType={profile.relationType} uuid={profile.uuid} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <BioSection bio={profile.bio} />
          {mode === "nsfw" && profile.bioAd ? (
            <AdultBioSection bioAd={profile.bioAd} />
          ) : null}
          <ProfileGallery images={profile.images} />
          <SonaSection sonas={hydratedSonas} />
          <KinksSection groups={kinkGroups} />
        </div>
        <aside className="space-y-6">
          <SocialsSection profile={profile} />
          <GroupsSection profile={profile} />
          <EventsSection profile={profile} />
        </aside>
      </div>
    </main>
  );
}

function BioSection({ bio }: { bio: ProfileBio | null }) {
  return (
    <Section title="Bio">
      {bio?.biography ? (
        <p className="text-sm leading-6 whitespace-pre-wrap text-foreground">
          {bio.biography}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">No biography provided.</p>
      )}
      <DefinitionList
        items={[
          ["Genders", bio?.genders?.join(", ")],
          ["Languages", bio?.languages?.join(", ")],
          ["Relationship", bio?.relationshipStatus],
          ["Orientation", bio?.sexualOrientation],
          ["Hobbies", bio?.hobbies?.map((hobby) => hobby.interest).join(", ")],
        ]}
      />
    </Section>
  );
}

function AdultBioSection({ bioAd }: { bioAd: ProfileBioAd }) {
  return (
    <Section title="Adult Bio">
      {bioAd.biography ? (
        <p className="text-sm leading-6 whitespace-pre-wrap text-foreground">
          {bioAd.biography}
        </p>
      ) : null}
      <DefinitionList
        items={[
          ["Positions", bioAd.sexPositions?.join(", ")],
          ["Behaviour", bioAd.behaviour?.join(", ")],
          ["Safe sex", bioAd.safeSex],
          [
            "Can host",
            bioAd.canHost === null ? undefined : bioAd.canHost ? "Yes" : "No",
          ],
        ]}
      />
    </Section>
  );
}

function SonaSection({ sonas }: { sonas: Sona[] }) {
  if (sonas.length === 0) {
    return null;
  }

  return (
    <Section title="Sonas">
      <div className="grid gap-3 sm:grid-cols-2">
        {sonas.map((sona) => (
          <div className="rounded-lg border border-border p-3" key={sona.id}>
            <div className="flex items-center gap-3">
              {sona.images[0]?.image ? (
                <BarqImage
                  alt={`${sona.displayName} image`}
                  className="size-14 rounded-lg object-cover"
                  image={sona.images[0].image}
                  width={180}
                />
              ) : (
                <div className="size-14 rounded-lg bg-muted" />
              )}
              <div>
                <h3 className="font-semibold">{sona.displayName}</h3>
                <p className="text-sm text-muted-foreground">
                  {[
                    sona.species?.displayName,
                    sona.hasFursuit ? "Fursuit" : null,
                  ]
                    .filter(Boolean)
                    .join(" / ")}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function KinksSection({
  groups,
}: {
  groups: ReturnType<typeof groupKinksByCategory>;
}) {
  if (groups.length === 0) {
    return null;
  }

  return (
    <Section title="Kinks">
      <div className="space-y-4">
        {groups.map((group) => (
          <div className="space-y-2" key={group.categoryName}>
            <h3 className="text-sm font-semibold">{group.categoryName}</h3>
            <div className="flex flex-wrap gap-2">
              {group.kinks.map((profileKink) => (
                <span
                  className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
                  key={profileKink.kink.id}
                >
                  {profileKink.kink.displayName}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function SocialsSection({ profile }: { profile: ProfileDetail }) {
  const socials = profile.socialAccounts ?? [];

  return (
    <Section title="Socials">
      {socials.length === 0 ? (
        <p className="text-sm text-muted-foreground">No socials listed.</p>
      ) : (
        <div className="space-y-2">
          {socials.map((account) => (
            <div
              className="rounded-lg border border-border p-3"
              key={account.id}
            >
              <p className="text-sm font-semibold">{account.socialNetwork}</p>
              {canRenderSocialValue(account) ? (
                account.url ? (
                  <a
                    className="text-sm text-primary hover:underline"
                    href={account.url}
                  >
                    {socialDisplayValue(account)}
                  </a>
                ) : (
                  <p className="text-sm text-foreground">
                    {socialDisplayValue(account)}
                  </p>
                )
              ) : (
                <p className="text-sm text-muted-foreground">
                  {visibilityLabel(account.accessPermission)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

function GroupsSection({ profile }: { profile: ProfileDetail }) {
  const groups = profile.groups ?? [];
  if (groups.length === 0) {
    return null;
  }

  return (
    <Section title="Groups">
      <div className="space-y-2">
        {groups.map(({ group }) => (
          <div
            className="flex items-center gap-3 rounded-lg border border-border p-3"
            key={group.uuid}
          >
            {group.image ? (
              <BarqImage
                alt={`${group.displayName} group image`}
                className="size-12 rounded-lg object-cover"
                image={group.image}
                width={160}
              />
            ) : (
              <div className="size-12 rounded-lg bg-muted" />
            )}
            <div>
              <p className="text-sm font-semibold">{group.displayName}</p>
              {group.isVerified ? (
                <p className="text-xs text-muted-foreground">Verified</p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function EventsSection({ profile }: { profile: ProfileDetail }) {
  const events = profile.events ?? [];
  if (events.length === 0) {
    return null;
  }

  return (
    <Section title="Events">
      <div className="space-y-2">
        {events.map(({ event }) => (
          <div className="rounded-lg border border-border p-3" key={event.uuid}>
            <p className="text-sm font-semibold">{event.displayName}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(event.eventBeginAt)} to {formatDate(event.eventEndAt)}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-5 text-card-foreground">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function DefinitionList({
  items,
}: {
  items: Array<[string, string | undefined | null]>;
}) {
  const visibleItems = items.filter(([, value]) => Boolean(value));

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <dl className="grid gap-3 text-sm sm:grid-cols-2">
      {visibleItems.map(([label, value]) => (
        <div key={label}>
          <dt className="font-medium text-muted-foreground">{label}</dt>
          <dd className="mt-1 text-foreground">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function BadgeList({ values }: { values: Array<string | undefined | null> }) {
  const visible = values.filter(Boolean);
  if (visible.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {visible.map((value) => (
        <span
          className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
          key={value}
        >
          {value}
        </span>
      ))}
    </div>
  );
}

function locationLabel(profile: ProfileDetail): string | null {
  const place = profile.location?.place ?? profile.location?.homePlace;
  const distance = distanceLabel(profile.location?.distance);
  const placeText = place
    ? [place.place, place.region, place.countryCode].filter(Boolean).join(", ")
    : null;

  return [placeText, distance].filter(Boolean).join(" / ") || null;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
