"use server";

import { auth } from "@/lib/auth";

export async function signInWithEmail(email: string, password: string) {
  await auth.api.signInEmail({
    body: {
      email,
      password,
    },
  });
}

export async function signUpWithEmail(
  name: string,
  email: string,
  password: string
) {
  await auth.api.signUpEmail({
    body: {
      name,
      email,
      password,
    },
  });
}
