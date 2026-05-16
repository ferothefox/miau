"use client";

import { useActionState, useState } from "react";
import {
  completeLoginAction,
  requestLoginCodeAction,
  type LoginActionState,
} from "@/app/(auth)/login/actions";

const initialState: LoginActionState = {
  status: "idle",
};

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [requestState, requestAction, requestPending] = useActionState(
    requestLoginCodeAction,
    initialState,
  );
  const [loginState, loginAction, loginPending] = useActionState(
    completeLoginAction,
    initialState,
  );

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-8">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
          Miau
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
          Sign in with Barq
        </h1>
        <p className="text-sm leading-6 text-zinc-600">
          Use your Barq email code. Tokens stay in an HTTP-only cookie and never
          enter browser storage.
        </p>
      </div>

      <form action={requestAction} className="space-y-4">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-zinc-800">Email</span>
          <input
            className="h-12 w-full rounded-lg border border-zinc-300 bg-white px-3 text-base text-zinc-950 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <SubmitButton pending={requestPending}>Request code</SubmitButton>
        <ActionMessage state={requestState} />
      </form>

      <form action={loginAction} className="space-y-4">
        <input type="hidden" name="email" value={email} />
        <label className="block space-y-2">
          <span className="text-sm font-medium text-zinc-800">Code</span>
          <input
            className="h-12 w-full rounded-lg border border-zinc-300 bg-white px-3 text-base tracking-[0.18em] text-zinc-950 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
          />
        </label>
        <SubmitButton pending={loginPending}>Complete login</SubmitButton>
        <ActionMessage state={loginState} />
      </form>
    </div>
  );
}

function SubmitButton({
  children,
  pending,
}: {
  children: React.ReactNode;
  pending: boolean;
}) {
  return (
    <button
      className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
      type="submit"
      disabled={pending}
    >
      {pending ? "Working..." : children}
    </button>
  );
}

function ActionMessage({ state }: { state: LoginActionState }) {
  if (state.status === "idle" || !state.message) {
    return null;
  }

  return (
    <p
      className={
        state.status === "success"
          ? "text-sm text-emerald-700"
          : "text-sm text-red-700"
      }
    >
      {state.message}
    </p>
  );
}
