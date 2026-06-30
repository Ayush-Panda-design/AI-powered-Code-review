import { HelpPageClient } from "@/features/dashboard/components/help-page-client";
import { requireSession } from "@/lib/auth-session";

export default async function HelpPage() {
  await requireSession("/dashboard/help");
  return <HelpPageClient />;
}
