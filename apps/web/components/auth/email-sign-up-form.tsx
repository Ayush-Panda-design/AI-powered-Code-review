"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signUpWithEmail } from "@/lib/actions/auth";
import { resolveCallbackUrl } from "@/lib/auth-proxy";

function EmailSignUpFormContent() {
  const searchParams = useSearchParams();
  const callbackUrl = resolveCallbackUrl(searchParams.get("callbackUrl"));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    setError(null);

    startTransition(async () => {
      try {
        await signUpWithEmail(
          String(formData.get("name") ?? ""),
          String(formData.get("email") ?? ""),
          String(formData.get("password") ?? ""),
          callbackUrl,
        );
      } catch {
        setError("Could not create account. Email may already be in use.");
      }
    });
  };

  return (
    <form action={handleSubmit} className="w-full">
      <FieldSet>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input id="name" name="name" autoComplete="name" required />
          </Field>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </Field>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creating account…" : "Create account"}
          </Button>
        </FieldGroup>
      </FieldSet>
    </form>
  );
}

export function EmailSignUpForm() {
  return (
    <Suspense
      fallback={
        <div className="h-48 w-full animate-pulse rounded-2xl bg-muted" />
      }
    >
      <EmailSignUpFormContent />
    </Suspense>
  );
}
