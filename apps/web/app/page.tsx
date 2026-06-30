import { redirect } from "next/navigation";

import { LandingPage } from "@/features/landing/landing-page";
import { DEFAULT_POST_AUTH_PATH } from "@/lib/auth-proxy";
import { getServerSession } from "@/lib/auth-session";
import { jetbrainsMono, vt323 } from "@/app/landing-fonts";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type HomeProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const hasOAuthCallback =
    typeof params.state === "string" &&
    (typeof params.code === "string" || typeof params.error === "string");
  const hasAppInstallCallback =
    typeof params.installation_id === "string" &&
    typeof params.state === "string";

  const session = await getServerSession();

  if (!hasOAuthCallback && !hasAppInstallCallback && session) {
    redirect(DEFAULT_POST_AUTH_PATH);
  }

  return (
    <div className={cn(jetbrainsMono.variable, vt323.variable)}>
      <LandingPage
        isSignedIn={Boolean(session)}
        userName={session?.user?.name}
      />
    </div>
  );
}
