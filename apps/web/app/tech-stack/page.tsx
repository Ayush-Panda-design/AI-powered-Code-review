import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ShipFlowLogo } from "@/components/brand/shipflow-logo";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModeToggle } from "@/components/ui/mode-toggle";

const stack = [
  { layer: "Monorepo", tech: "Turborepo + pnpm" },
  { layer: "Web app", tech: "Next.js 16, Shadcn UI, React Server Components" },
  { layer: "API", tech: "tRPC (type-safe procedures)" },
  { layer: "Auth", tech: "BetterAuth (GitHub OAuth + email/password)" },
  { layer: "Database", tech: "PostgreSQL (Neon) + Prisma ORM" },
  { layer: "Jobs", tech: "Inngest (clarify, PRD, tasks, review, release, codegen)" },
  { layer: "GitHub", tech: "Octokit App + webhooks (PR sync, diff analysis, comments)" },
  { layer: "AI", tech: "Vercel AI SDK + OpenRouter" },
  { layer: "Vectors", tech: "Pinecone (optional PR context retrieval)" },
  { layer: "Billing", tech: "Razorpay (Free / Pro plans, AI credits)" },
  { layer: "Deploy", tech: "Vercel" },
];

const workflows = [
  "Feature clarify → PRD approval → task generation → plan approval (multi-member)",
  "GitHub PR webhook → PRD-aware AI review → fix/re-review loop",
  "Release readiness check → human approval gate → shipped",
  "Workspace invites, project picker, manual PR linking",
];

export default function TechStackPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 via-white to-zinc-100 dark:from-zinc-950 dark:via-black dark:to-zinc-950">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6">
        <Link href="/">
          <ShipFlowLogo size="sm" />
        </Link>
        <div className="flex items-center gap-3">
          <ModeToggle />
          <Button variant="outline" render={<Link href="/" />}>
            <ArrowLeft className="mr-2 size-4" />
            Home
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-8 px-6 pb-20">
        <div>
          <p className="text-sm font-medium text-violet-600 dark:text-violet-400">
            ChaiCode Hackathon · Builder Mode On
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Technology stack</h1>
          <p className="mt-2 text-muted-foreground">
            ShipFlow AI is a full-stack tRPC monorepo built for the complete
            product delivery lifecycle — from feature request to shipped code.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Stack</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y">
              {stack.map((row) => (
                <div
                  key={row.layer}
                  className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between"
                >
                  <dt className="font-medium">{row.layer}</dt>
                  <dd className="text-sm text-muted-foreground sm:text-right">
                    {row.tech}
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workflows powered by this stack</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
              {workflows.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
