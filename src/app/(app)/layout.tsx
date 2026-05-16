import Link from "next/link";
import { choosePrimaryImage } from "@/domain/barq/images";
import { normalizeProfileDetail } from "@/domain/barq/normalize";
import { UserMenu } from "@/features/auth/user-menu";
import { user } from "@/server/barq/operations";
import { redirectToLoginOnAuthFailure } from "@/server/barq/redirects";
import { requireSession } from "@/server/session";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireSession();
  const viewer = await user(session.token).catch(redirectToLoginOnAuthFailure);
  const profile = normalizeProfileDetail(viewer.user.profile);
  const profileImage = choosePrimaryImage(profile, "sfw");

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            className="text-lg font-semibold tracking-tight text-foreground"
            href="/feed"
          >
            Miau
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link
              className="font-medium text-muted-foreground transition hover:text-foreground"
              href="/feed"
            >
              Feed
            </Link>
            <UserMenu
              displayName={profile.displayName}
              image={profileImage}
              username={profile.username}
              uuid={profile.uuid}
            />
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
