"use client";

import { useActionState, useState } from "react";
import {
  completeLoginAction,
  requestLoginCodeAction,
  type LoginActionState,
} from "@/app/(auth)/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
        <p className="text-sm font-semibold tracking-wide text-primary uppercase">
          Miau
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Sign in with Barq
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Use your Barq email code. Tokens stay in an HTTP-only cookie and never
          enter browser storage.
        </p>
      </div>

      <form action={requestAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="login-email">Email</Label>
          <Input
            className="h-12"
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <Button className="h-11 w-full" disabled={requestPending} type="submit">
          {requestPending ? "Working..." : "Request code"}
        </Button>
        <ActionMessage state={requestState} />
      </form>

      <form action={loginAction} className="space-y-4">
        <input type="hidden" name="email" value={email} />
        <div className="space-y-2">
          <Label htmlFor="login-code">Code</Label>
          <Input
            className="h-12 tracking-[0.18em]"
            id="login-code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
          />
        </div>
        <Button className="h-11 w-full" disabled={loginPending} type="submit">
          {loginPending ? "Working..." : "Complete login"}
        </Button>
        <ActionMessage state={loginState} />
      </form>
    </div>
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
          ? "text-sm text-primary"
          : "text-sm text-destructive"
      }
    >
      {state.message}
    </p>
  );
}
