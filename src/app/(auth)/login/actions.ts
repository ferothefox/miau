"use server";

import { redirect } from "next/navigation";
import { requestEmailLoginCode, loginWithEmailCode } from "@/server/barq/auth";
import { setSession } from "@/server/session";

export type LoginActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  email?: string;
};

export async function requestLoginCodeAction(
  _state: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const email = formValue(formData, "email").toLowerCase();

  if (!isEmail(email)) {
    return {
      status: "error",
      message: "Enter a valid email address.",
      email,
    };
  }

  try {
    const message = await requestEmailLoginCode(email);
    return {
      status: "success",
      message: message || "Code sent. Check your email.",
      email,
    };
  } catch {
    return {
      status: "error",
      message: "Could not request a login code. Try again.",
      email,
    };
  }
}

export async function completeLoginAction(
  _state: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const email = formValue(formData, "email").toLowerCase();
  const code = formValue(formData, "code");

  if (!isEmail(email) || !code) {
    return {
      status: "error",
      message: "Enter the email and code from Barq.",
      email,
    };
  }

  try {
    const token = await loginWithEmailCode(email, code);
    await setSession(token);
  } catch {
    return {
      status: "error",
      message: "The login code was not accepted.",
      email,
    };
  }

  redirect("/feed");
}

function formValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
