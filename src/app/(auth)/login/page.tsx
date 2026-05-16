import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/login-form";
import { getSession } from "@/server/session";

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect("/feed");
  }

  return (
    <main className="flex min-h-dvh bg-background px-6 py-12">
      <section className="m-auto w-full">
        <LoginForm />
      </section>
    </main>
  );
}
