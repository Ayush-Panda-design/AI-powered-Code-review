import Link from "next/link";

import { EmailSignUpForm } from "@/components/auth/email-sign-up-form";
import { GithubSignInForm } from "@/components/auth/github-sign-in-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { redirectIfAuthenticated } from "@/lib/auth-session";
import { resolveCallbackUrl } from "@/lib/auth-proxy";

type SignUpPageProps = {
  searchParams: Promise<{
    callbackUrl?: string;
  }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const { callbackUrl } = await searchParams;
  const safeCallbackUrl = resolveCallbackUrl(callbackUrl);

  await redirectIfAuthenticated(safeCallbackUrl);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>Create account</CardTitle>
        <CardDescription>
          Sign up with GitHub or email to start using ShipFlow AI.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <GithubSignInForm />
        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">or</span>
          <Separator className="flex-1" />
        </div>
        <EmailSignUpForm />
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/sign-in" className="underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
