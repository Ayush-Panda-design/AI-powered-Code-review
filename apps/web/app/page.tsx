import { LandingPage } from "@/features/landing/landing-page";
import { getServerSession } from "@/lib/auth-session";
import { jetbrainsMono, vt323 } from "@/app/landing-fonts";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession();

  return (
    <div className={cn(jetbrainsMono.variable, vt323.variable)}>
      <LandingPage
        isSignedIn={Boolean(session)}
        userName={session?.user?.name}
      />
    </div>
  );
}
