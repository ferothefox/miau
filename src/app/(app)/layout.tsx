import Link from "next/link";
import { logoutAction } from "./actions";
import { normalizeProfileDetail } from "@/domain/barq/normalize";
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

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-950">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link className="text-lg font-semibold tracking-tight text-zinc-950" href="/feed">
            Miau
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link className="font-medium text-zinc-700 hover:text-zinc-950" href="/feed">
              Feed
            </Link>
            <Link
              className="hidden font-medium text-zinc-700 hover:text-zinc-950 sm:inline"
              href={`/profiles/${profile.uuid}`}
            >
              {profile.displayName}
            </Link>
            <form action={logoutAction}>
              <button
                className="rounded-md border border-zinc-300 px-3 py-1.5 font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-950"
                type="submit"
              >
                Log out
              </button>
            </form>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
