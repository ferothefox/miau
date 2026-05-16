import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { choosePrimaryImage } from "@/domain/barq/images";
import { normalizeProfileDetail } from "@/domain/barq/normalize";
import { UserMenu } from "@/features/auth/user-menu";
import { getViewerUser } from "@/server/barq/cached";
import { redirectToLoginOnAuthFailure } from "@/server/barq/redirects";
import { requireSession } from "@/server/session";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireSession();

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-10 overflow-visible">
        <div aria-hidden="true" className="header-bar__blur">
          <span className="header-bar__blur-layer header-bar__blur-layer--1" />
          <span className="header-bar__blur-layer header-bar__blur-layer--2" />
          <span className="header-bar__blur-layer header-bar__blur-layer--3" />
          <span className="header-bar__blur-layer header-bar__blur-layer--4" />
          <span className="header-bar__blur-layer header-bar__blur-layer--5" />
        </div>
        <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            className="text-lg font-semibold tracking-tight text-foreground"
            href="/feed"
            prefetch
          >
            MIAU!
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Suspense fallback={<AccountMenuFallback />}>
              <ViewerMenu token={session.token} />
            </Suspense>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}

async function ViewerMenu({ token }: { token: string }) {
  const viewer = await getViewerUser(token).catch(redirectToLoginOnAuthFailure);
  const profile = normalizeProfileDetail(viewer.user.profile);
  const profileImage = choosePrimaryImage(profile, "sfw");

  return (
    <UserMenu
      displayName={profile.displayName}
      image={profileImage}
      username={profile.username}
      uuid={profile.uuid}
    />
  );
}

function AccountMenuFallback() {
  return (
    <Button
      aria-label="Account menu loading"
      className="rounded-full"
      disabled
      size="icon-lg"
      variant="outline"
    />
  );
}
