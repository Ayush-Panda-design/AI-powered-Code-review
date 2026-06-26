import Link from "next/link";
import { ArrowRight, CheckCircle2, GitBranch, LayoutDashboard, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerSession } from "@/lib/auth-session";
import { DEFAULT_POST_AUTH_PATH } from "@/lib/auth-proxy";

export const dynamic = "force-dynamic";

const workflow = [
  "Feature Request",
  "PRD",
  "Tasks",
  "Code",
  "AI Review",
  "Approval",
  "Ship",
];

export default async function Home() {
  const session = await getServerSession();

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 via-white to-zinc-100 dark:from-zinc-950 dark:via-black dark:to-zinc-950">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <Sparkles className="size-5 text-violet-500" />
          ShipFlow AI
        </Link>
        <div className="flex items-center gap-3">
          <ModeToggle />
          {session ? (
            <Button render={<Link href={DEFAULT_POST_AUTH_PATH} />}>
              Open dashboard
            </Button>
          ) : (
            <Button
              render={
                <Link
                  href={`/sign-in?callbackUrl=${encodeURIComponent(DEFAULT_POST_AUTH_PATH)}`}
                />
              }
            >
              Sign in
            </Button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-20 pt-10">
        {session ? (
          <section className="mb-10">
            <Card className="border-violet-500/30 bg-violet-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <LayoutDashboard className="size-5 text-violet-500" />
                  Welcome back{session.user.name ? `, ${session.user.name}` : ""}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  Continue shipping features from your dashboard — feature requests,
                  PR reviews, and release approvals are waiting.
                </p>
                <Button render={<Link href={DEFAULT_POST_AUTH_PATH} />}>
                  Go to dashboard <ArrowRight className="ml-2 size-4" />
                </Button>
              </CardContent>
            </Card>
          </section>
        ) : null}

        <section className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <p className="text-sm font-medium text-violet-600 dark:text-violet-400">
              ChaiCode Hackathon · Builder Mode On
            </p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Ship features from idea to production with AI-assisted delivery
            </h1>
            <p className="text-lg text-muted-foreground">
              ShipFlow AI manages the full loop: customer requests, PRD generation,
              engineering tasks, GitHub PRs, AI QA reviews, fixes, human approval, and release.
            </p>
            <div className="flex flex-wrap gap-3">
              {session ? (
                <Button
                  size="lg"
                  render={<Link href={DEFAULT_POST_AUTH_PATH} />}
                >
                  Start shipping <ArrowRight className="ml-2 size-4" />
                </Button>
              ) : (
                <Button
                  size="lg"
                  render={
                    <Link
                      href={`/sign-in?callbackUrl=${encodeURIComponent(DEFAULT_POST_AUTH_PATH)}`}
                    />
                  }
                >
                  Sign in to start <ArrowRight className="ml-2 size-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="lg"
                render={
                  <Link
                    href="https://github.com/Ayush-Panda-design/AI-powered-Code-review"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                View on GitHub
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <p className="mb-4 text-sm font-medium text-muted-foreground">Core loop</p>
            <div className="flex flex-wrap gap-2">
              {workflow.map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <span className="rounded-full bg-violet-500/10 px-3 py-1 text-sm font-medium">
                    {step}
                  </span>
                  {i < workflow.length - 1 && (
                    <ArrowRight className="size-3 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 size-4 text-emerald-500" /> Multi-tenant
                workspaces with billing
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 size-4 text-emerald-500" /> AI PRD + task
                generation via Inngest
              </li>
              <li className="flex gap-2">
                <GitBranch className="mt-0.5 size-4 text-blue-500" /> GitHub webhooks +
                PR-aware AI reviews
              </li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
