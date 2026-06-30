import { LandingPage } from "@/features/landing/landing-page";
import { getServerSession } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession();

  return (
    <LandingPage
      isSignedIn={Boolean(session)}
      userName={session?.user?.name}
    />
  );
}
