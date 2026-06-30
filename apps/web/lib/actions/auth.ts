"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import {
  resolveAbsoluteCallbackUrl,
  resolveCallbackUrl,
  SIGN_IN_PATH,
} from "@/lib/auth-proxy";

export async function signInWithEmail(
  email: string,
  password: string,
  callbackUrl?: string
) {
  const requestHeaders = await headers();
  const safeCallbackUrl = resolveAbsoluteCallbackUrl(
    callbackUrl,
    requestHeaders,
  );

  await auth.api.signInEmail({
    body: {
      email,
      password,
      callbackURL: safeCallbackUrl,
    },
  });

  redirect(resolveCallbackUrl(callbackUrl));
}

export async function signUpWithEmail(
  name: string,
  email: string,
  password: string,
  callbackUrl?: string
) {
  const requestHeaders = await headers();
  const safeCallbackUrl = resolveAbsoluteCallbackUrl(
    callbackUrl,
    requestHeaders,
  );

  await auth.api.signUpEmail({
    body: {
      name,
      email,
      password,
      callbackURL: safeCallbackUrl,
    },
  });

  redirect(resolveCallbackUrl(callbackUrl));
}

export async function signInWithGithubAction(callbackUrl?: string) {
  const requestHeaders = await headers();
  const safeCallbackUrl = resolveAbsoluteCallbackUrl(
    callbackUrl,
    requestHeaders,
  );

  const result = await auth.api.signInSocial({
    body: {
      provider: "github",
      callbackURL: safeCallbackUrl,
    },
    headers: requestHeaders,
  });

  if (result.url) {
    redirect(result.url);
  }

  throw new Error("GitHub sign-in did not return an authorization URL");
}

export async function signOutAction() {
  await auth.api.signOut({
    headers: await headers(),
  });

  redirect(SIGN_IN_PATH);
}
