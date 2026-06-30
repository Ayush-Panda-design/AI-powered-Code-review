"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  CircleHelp,
  CreditCard,
  FileText,
  FolderGit2,
  FolderKanban,
  GitPullRequest,
  History,
  Inbox,
  Kanban,
  LayoutDashboard,
  Lightbulb,
  MessagesSquare,
  Rocket,
  ShieldCheck,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DASHBOARD_BASE_PATH } from "@/features/dashboard/lib/routes";
import { cn } from "@/lib/utils";

type QuickLink = {
  id: string;
  label: string;
  icon: LucideIcon;
};

type JourneyStep = {
  step: number;
  title: string;
  what: string;
  why: string;
  how: string;
  icon: LucideIcon;
  color: string;
};

type PageGuide = {
  title: string;
  href: string;
  icon: LucideIcon;
  summary: string;
  when: string;
  steps: string[];
  accent: string;
};

const quickLinks: QuickLink[] = [
  { id: "start", label: "Getting started", icon: Sparkles },
  { id: "journey", label: "Full journey", icon: Rocket },
  { id: "pages", label: "Every page", icon: LayoutDashboard },
  { id: "github", label: "Connect code", icon: FolderGit2 },
  { id: "team", label: "Team & sharing", icon: Users },
  { id: "billing", label: "Plans & credits", icon: CreditCard },
  { id: "faq", label: "Questions", icon: CircleHelp },
];

const journeySteps: JourneyStep[] = [
  {
    step: 1,
    title: "Capture the idea",
    what: "Write down what someone wants built — a new button, a report, a fix, anything.",
    why: "Everyone needs one clear place for requests. No more lost messages or forgotten emails.",
    how: "Go to Feature Requests or Customer Intake. Give it a short title and describe what is needed.",
    icon: Lightbulb,
    color: "amber",
  },
  {
    step: 2,
    title: "Let AI ask questions",
    what: "ShipFlow reads your request and asks follow-up questions to fill in gaps.",
    why: "Vague ideas lead to wrong builds. Questions make sure the team understands before work starts.",
    how: "Open the feature, click to start clarifying, and answer each question. Reply when you know more.",
    icon: MessagesSquare,
    color: "violet",
  },
  {
    step: 3,
    title: "Create the plan document",
    what: "AI turns the clarified idea into a written plan (PRD) — goals, scope, and what success looks like.",
    why: "A shared plan keeps designers, builders, and reviewers aligned on the same goal.",
    how: "When clarifying is done, generate the plan. Read it, edit if needed, then approve it.",
    icon: FileText,
    color: "sky",
  },
  {
    step: 4,
    title: "Break work into tasks",
    what: "The plan is split into small, trackable tasks on a board — like sticky notes in columns.",
    why: "Big ideas are hard to finish. Small tasks show progress and who does what.",
    how: "Generate tasks from the approved plan. Review the board, then approve the plan as a team.",
    icon: Kanban,
    color: "emerald",
  },
  {
    step: 5,
    title: "Build and link code",
    what: "Your team writes code as usual. When a change is ready on GitHub, link it to this feature.",
    why: "Linking code to the original request proves the right thing is being built.",
    how: "After plan approval, development begins. Connect GitHub, sync pull requests, and link one to the feature.",
    icon: GitPullRequest,
    color: "orange",
  },
  {
    step: 6,
    title: "AI reviews the change",
    what: "AI reads the code change and checks it against the plan and tasks.",
    why: "Catches mismatches early — before a human spends time on a wrong or incomplete fix.",
    how: "Open Pull Requests, sync from GitHub, and run a review. Read findings: must-fix vs nice-to-have.",
    icon: ShieldCheck,
    color: "rose",
  },
  {
    step: 7,
    title: "Approve and ship",
    what: "A teammate gives final sign-off. Only then is the feature marked as shipped.",
    why: "Shipping is a deliberate choice. Nothing goes live without a human saying yes.",
    how: "Go to Release Approval when the feature is ready. Approve to ship, or send back for fixes.",
    icon: Rocket,
    color: "indigo",
  },
];

const pageGuides: PageGuide[] = [
  {
    title: "Overview",
    href: DASHBOARD_BASE_PATH,
    icon: LayoutDashboard,
    summary: "Your home screen. See active features, recent activity, and setup tips.",
    when: "Open this first each day to see what needs attention.",
    steps: [
      "Check the summary cards for open work.",
      "Follow the setup guide if you are new.",
      "Jump to any feature that needs action.",
    ],
    accent: "border-sky-500/30 bg-sky-500/5",
  },
  {
    title: "Workspaces",
    href: `${DASHBOARD_BASE_PATH}/workspaces`,
    icon: Building2,
    summary: "Separate spaces for different teams or companies.",
    when: "Use when more than one group shares ShipFlow.",
    steps: [
      "Create a workspace for each team.",
      "Invite members by email.",
      "Switch workspaces from the bottom of the sidebar.",
    ],
    accent: "border-violet-500/30 bg-violet-500/5",
  },
  {
    title: "Projects",
    href: `${DASHBOARD_BASE_PATH}/projects`,
    icon: FolderKanban,
    summary: "Group related features under one product or area.",
    when: "Create a project before adding requests — everything attaches to a project.",
    steps: [
      "Create a project with a clear name.",
      "Pick which project is active for new work.",
      "Filter tasks and requests by project later.",
    ],
    accent: "border-emerald-500/30 bg-emerald-500/5",
  },
  {
    title: "Feature Requests",
    href: `${DASHBOARD_BASE_PATH}/feature-requests`,
    icon: Lightbulb,
    summary: "The main list of ideas and features moving toward release.",
    when: "Start here for any new work your team wants to track.",
    steps: [
      "Click to create a new request.",
      "Open any item to see its full journey and next step.",
      "Follow the status bar — it tells you what to do next.",
    ],
    accent: "border-amber-500/30 bg-amber-500/5",
  },
  {
    title: "Customer Intake",
    href: `${DASHBOARD_BASE_PATH}/intake`,
    icon: Inbox,
    summary: "Log requests that came from a customer email, ticket, or call.",
    when: "Use when someone outside your team asks for something.",
    steps: [
      "Choose how the request arrived (email, ticket, or call).",
      "Paste or type what they said.",
      "AI clarifying starts automatically — answer when ready.",
    ],
    accent: "border-orange-500/30 bg-orange-500/5",
  },
  {
    title: "PRD Editor",
    href: `${DASHBOARD_BASE_PATH}/prd`,
    icon: FileText,
    summary: "View and edit the written plans AI created for your features.",
    when: "After a plan is generated, refine wording before approving.",
    steps: [
      "Pick a feature from the list.",
      "Read each section carefully.",
      "Edit text directly if something is wrong or missing.",
    ],
    accent: "border-sky-500/30 bg-sky-500/5",
  },
  {
    title: "Task Board",
    href: `${DASHBOARD_BASE_PATH}/tasks`,
    icon: Kanban,
    summary: "A visual board of tasks — To Do, In Progress, Done.",
    when: "After tasks are generated and the plan is approved.",
    steps: [
      "Drag cards between columns as work moves.",
      "Filter by feature or project if the board is busy.",
      "Use it in standups to see who is doing what.",
    ],
    accent: "border-emerald-500/30 bg-emerald-500/5",
  },
  {
    title: "Pull Requests",
    href: `${DASHBOARD_BASE_PATH}/pull-requests`,
    icon: GitPullRequest,
    summary: "Code changes from GitHub, ready for AI review.",
    when: "After GitHub is connected and your team opens pull requests.",
    steps: [
      "Click Sync from GitHub to load the latest changes.",
      "Press Review on any pull request.",
      "Read AI findings and fix must-fix items before shipping.",
    ],
    accent: "border-rose-500/30 bg-rose-500/5",
  },
  {
    title: "Review History",
    href: `${DASHBOARD_BASE_PATH}/review-history`,
    icon: History,
    summary: "A log of every AI review that has run.",
    when: "You want to see past results or compare reviews over time.",
    steps: [
      "Browse by date or pull request.",
      "Open any review to see full details.",
      "Share findings with teammates who were not there.",
    ],
    accent: "border-fuchsia-500/30 bg-fuchsia-500/5",
  },
  {
    title: "Review SLA",
    href: `${DASHBOARD_BASE_PATH}/review-sla`,
    icon: BarChart3,
    summary: "Charts showing how fast reviews happen per repository.",
    when: "You care about review speed and team responsiveness.",
    steps: [
      "Pick a time range.",
      "Compare repos side by side.",
      "Use it to spot bottlenecks, not to blame individuals.",
    ],
    accent: "border-cyan-500/30 bg-cyan-500/5",
  },
  {
    title: "Activity",
    href: `${DASHBOARD_BASE_PATH}/activity`,
    icon: Activity,
    summary: "A timeline of everything that happened in your workspace.",
    when: "You need to audit who did what and when.",
    steps: [
      "Scroll through recent events.",
      "Filter if your workspace is large.",
      "Useful after approvals, rejections, or status changes.",
    ],
    accent: "border-slate-500/30 bg-slate-500/5",
  },
  {
    title: "Release Approval",
    href: `${DASHBOARD_BASE_PATH}/approvals`,
    icon: ShieldCheck,
    summary: "Features waiting for a human yes before they ship.",
    when: "A feature passed review and is ready for final sign-off.",
    steps: [
      "Read the summary and linked pull request.",
      "Approve to mark as shipped, or reject with a reason.",
      "Rejected items go back for fixes — that is normal.",
    ],
    accent: "border-indigo-500/30 bg-indigo-500/5",
  },
  {
    title: "Repositories",
    href: `${DASHBOARD_BASE_PATH}/repositories`,
    icon: FolderGit2,
    summary: "Choose which GitHub repos ShipFlow can read.",
    when: "After installing the GitHub App — connect repos before syncing PRs.",
    steps: [
      "Select repos that belong to your project.",
      "Only connected repos appear in Pull Requests.",
      "Add more repos anytime as your team grows.",
    ],
    accent: "border-teal-500/30 bg-teal-500/5",
  },
  {
    title: "Billing",
    href: `${DASHBOARD_BASE_PATH}/billing`,
    icon: CreditCard,
    summary: "Your plan, AI credits, and upgrade options.",
    when: "Credits run low or you need more repos or team seats.",
    steps: [
      "Check remaining AI credits on the billing page.",
      "Upgrade to Pro for more capacity.",
      "AI actions (clarify, plan, review) use credits.",
    ],
    accent: "border-yellow-500/30 bg-yellow-500/5",
  },
  {
    title: "GitHub App",
    href: `${DASHBOARD_BASE_PATH}/github-app`,
    icon: FolderGit2,
    summary: "Install ShipFlow on your GitHub account so it can read pull requests.",
    when: "Before repositories, pull requests, or AI code review will work.",
    steps: [
      "Sign in with GitHub (email-only accounts cannot do this step).",
      "Click install and follow GitHub's prompts.",
      "Come back and connect repos on the Repositories page.",
    ],
    accent: "border-sky-500/30 bg-sky-500/5",
  },
];

const faqItems = [
  {
    q: "Do I need GitHub to use ShipFlow?",
    a: "No for planning. You can capture requests, clarify with AI, write plans, and manage tasks with just an email account. GitHub is only needed when you want to sync code changes and run AI reviews on them.",
  },
  {
    q: "What is the difference between email and GitHub sign-in?",
    a: "GitHub sign-in unlocks everything — planning plus code sync and reviews. Email sign-in gives you planning tools only. You can always sign in with GitHub later to add code features.",
  },
  {
    q: "Why must I approve the plan before tasks appear?",
    a: "Approval means the team agrees on what will be built. Without it, tasks might be created from a plan nobody checked — leading to wasted work.",
  },
  {
    q: "Why must I approve the plan again after tasks are made?",
    a: "The second approval confirms the broken-down tasks match what everyone expects. It unlocks development so builders know they are working on the right thing.",
  },
  {
    q: "What if AI finds problems in my code review?",
    a: "Findings are split into must-fix (blocking) and suggestions (optional). Fix blocking items, push an update to GitHub, sync again, and re-run the review.",
  },
  {
    q: "Can customers submit requests themselves?",
    a: "Your team logs customer requests through Customer Intake. There is also a way for other tools to send requests in automatically — ask your admin if that is set up.",
  },
  {
    q: "What uses AI credits?",
    a: "Clarifying questions, generating plans, creating tasks, and running code reviews all use credits. Check Billing to see how many you have left.",
  },
  {
    q: "What does Shipped mean?",
    a: "A human approved the feature for release. It is the final happy state — the idea went from request to delivered with checks along the way.",
  },
  {
    q: "I see Duplicate on a feature — what happened?",
    a: "AI noticed this request is very similar to one already in the system. Open both and merge or close the duplicate so work does not happen twice.",
  },
  {
    q: "Where do I switch between teams?",
    a: "Use the workspace switcher at the bottom of the sidebar. Each workspace has its own projects, features, and members.",
  },
];

const colorMap: Record<string, { bg: string; text: string; ring: string }> = {
  amber: {
    bg: "bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-400",
    ring: "ring-amber-500/30",
  },
  violet: {
    bg: "bg-violet-500/10",
    text: "text-violet-700 dark:text-violet-400",
    ring: "ring-violet-500/30",
  },
  sky: {
    bg: "bg-sky-500/10",
    text: "text-sky-700 dark:text-sky-400",
    ring: "ring-sky-500/30",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-400",
    ring: "ring-emerald-500/30",
  },
  orange: {
    bg: "bg-orange-500/10",
    text: "text-orange-700 dark:text-orange-400",
    ring: "ring-orange-500/30",
  },
  rose: {
    bg: "bg-rose-500/10",
    text: "text-rose-700 dark:text-rose-400",
    ring: "ring-rose-500/30",
  },
  indigo: {
    bg: "bg-indigo-500/10",
    text: "text-indigo-700 dark:text-indigo-400",
    ring: "ring-indigo-500/30",
  },
};

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

function SectionHeading({
  id,
  icon: Icon,
  title,
  description,
}: {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  const { ref, visible } = useInView();

  return (
    <div
      id={id}
      ref={ref}
      className={cn("scroll-mt-6 space-y-2", visible && "help-fade-up")}
    >
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}

export function HelpPageClient() {
  const [activeSection, setActiveSection] = useState("start");

  useEffect(() => {
    const sections = quickLinks.map((l) => l.id);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.25, 0.5] },
    );

    for (const id of sections) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-12 pb-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/5 via-background to-status-progress/10 p-8 md:p-10">
        <div className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-primary/10 help-pulse-ring" />
        <div className="pointer-events-none absolute bottom-4 right-12 size-16 rounded-2xl bg-status-warning/20 help-float" />
        <div className="pointer-events-none absolute right-1/3 top-6 size-8 rounded-full bg-status-success/30 help-float [animation-delay:1s]" />

        <div className="relative space-y-4 help-fade-up">
          <Badge variant="secondary" className="gap-1.5">
            <Sparkles className="size-3" />
            Your complete guide
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Everything you need to{" "}
            <span className="help-shine-text">ship with confidence</span>
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
            ShipFlow AI walks your team from a customer idea all the way to a
            released feature — with AI help at each step and a human yes before
            anything goes live. This guide explains every part in plain language.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href={`${DASHBOARD_BASE_PATH}/feature-requests`}
              className={buttonVariants({ size: "sm" })}
            >
              Start a feature
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href={`${DASHBOARD_BASE_PATH}#get-started`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Setup checklist
            </Link>
          </div>
        </div>
      </section>

      {/* Quick nav */}
      <nav
        aria-label="Help sections"
        className="sticky top-0 z-10 -mx-1 rounded-2xl border bg-background/80 p-2 backdrop-blur-md"
      >
        <div className="flex gap-1 overflow-x-auto scrollbar-none">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            const isActive = activeSection === link.id;
            return (
              <a
                key={link.id}
                href={`#${link.id}`}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {link.label}
              </a>
            );
          })}
        </div>
      </nav>

      {/* Getting started */}
      <section className="space-y-6">
        <SectionHeading
          id="start"
          icon={Sparkles}
          title="Getting started"
          description="Three things to do before your first feature"
        />

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              step: "1",
              title: "Create your account",
              body: "Sign in with GitHub if you want code reviews. Sign in with email if you only need planning tools for now.",
              tip: "You can add GitHub later from the Overview page.",
            },
            {
              step: "2",
              title: "Set up your space",
              body: "Create a workspace for your team and a project for your product. Every new request belongs to a project.",
              tip: "Switch workspaces from the bottom of the sidebar.",
            },
            {
              step: "3",
              title: "Add your first request",
              body: "Go to Feature Requests or Customer Intake. Describe what you want built in everyday words.",
              tip: "Short title, clear description — AI will ask the rest.",
            },
          ].map((card, i) => (
            <Card
              key={card.step}
              className={cn(
                "help-card-hover help-fade-up overflow-hidden",
                `border-l-4 border-l-primary/40`,
              )}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Step {card.step}</Badge>
                  <CheckCircle2 className="size-4 text-muted-foreground/50" />
                </div>
                <CardTitle className="text-base">{card.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>{card.body}</p>
                <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-foreground/80">
                  💡 {card.tip}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-dashed bg-muted/30">
          <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="font-medium">Two ways to sign in — pick what fits today</p>
              <p className="text-sm text-muted-foreground">
                <strong>GitHub</strong> — full journey including code review.{" "}
                <strong>Email</strong> — planning only until you connect GitHub.
              </p>
            </div>
            <Link href="/sign-in" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Sign-in options
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Full journey */}
      <section className="space-y-6">
        <SectionHeading
          id="journey"
          icon={Rocket}
          title="The full journey"
          description="Seven steps from idea to shipped — what happens, why it matters, and what you do"
        />

        <div className="relative space-y-4">
          <div
            aria-hidden
            className="absolute bottom-4 left-6 top-4 hidden w-px bg-gradient-to-b from-amber-500/40 via-violet-500/40 to-indigo-500/40 md:block"
          />

          {journeySteps.map((item, i) => {
            const Icon = item.icon;
            const colors = colorMap[item.color] ?? colorMap.sky;

            return (
              <Card
                key={item.step}
                className={cn(
                  "help-card-hover help-fade-up relative overflow-hidden md:ml-4",
                  "ring-1 ring-transparent hover:ring-border",
                )}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <CardContent className="grid gap-4 pt-6 md:grid-cols-[auto_1fr]">
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "relative z-10 flex size-12 shrink-0 items-center justify-center rounded-2xl ring-2",
                        colors.bg,
                        colors.text,
                        colors.ring,
                      )}
                    >
                      <Icon className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">Step {item.step}</Badge>
                        <h3 className="font-semibold">{item.title}</h3>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl bg-muted/50 p-3">
                          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            What happens
                          </p>
                          <p className="text-sm">{item.what}</p>
                        </div>
                        <div className="rounded-xl bg-muted/50 p-3">
                          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Why it matters
                          </p>
                          <p className="text-sm">{item.why}</p>
                        </div>
                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-primary">
                            What you do
                          </p>
                          <p className="text-sm">{item.how}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Every page */}
      <section className="space-y-6">
        <SectionHeading
          id="pages"
          icon={LayoutDashboard}
          title="Every page explained"
          description="What each sidebar item is for, when to open it, and what to do there"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          {pageGuides.map((page, i) => {
            const Icon = page.icon;
            return (
              <Card
                key={page.href}
                className={cn("help-card-hover help-fade-up", page.accent)}
                style={{ animationDelay: `${(i % 6) * 50}ms` }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-background/80">
                        <Icon className="size-4" />
                      </div>
                      <CardTitle className="text-base">{page.title}</CardTitle>
                    </div>
                    <Link
                      href={page.href}
                      className="shrink-0 text-xs text-primary underline-offset-4 hover:underline"
                    >
                      Open →
                    </Link>
                  </div>
                  <CardDescription>{page.summary}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p>
                    <span className="font-medium text-foreground">When to use: </span>
                    <span className="text-muted-foreground">{page.when}</span>
                  </p>
                  <ol className="list-inside list-decimal space-y-1 text-muted-foreground">
                    {page.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* GitHub */}
      <section className="space-y-6">
        <SectionHeading
          id="github"
          icon={FolderGit2}
          title="Connecting your code"
          description="Three steps to sync pull requests and run AI reviews — only needed for the build-and-ship part"
        />

        <Card className="overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-sky-500 via-violet-500 to-emerald-500">
            <div className="h-full w-1/3 rounded-full bg-white/40 motion-safe:animate-[task-gen-slide_2s_ease-in-out_infinite]" />
          </div>
          <CardContent className="grid gap-6 pt-6 md:grid-cols-3">
            {[
              {
                n: 1,
                title: "Sign in with GitHub",
                text: "Use the same GitHub account that owns your code. Email-only accounts cannot connect code.",
                href: "/sign-in",
                label: "Sign in",
              },
              {
                n: 2,
                title: "Install the GitHub App",
                text: "This lets ShipFlow read your pull requests safely. Signing in alone is not enough.",
                href: `${DASHBOARD_BASE_PATH}/github-app`,
                label: "GitHub App",
              },
              {
                n: 3,
                title: "Connect repositories",
                text: "Pick which repos belong to your project. Only those repos sync and get reviewed.",
                href: `${DASHBOARD_BASE_PATH}/repositories`,
                label: "Repositories",
              },
            ].map((step) => (
              <div
                key={step.n}
                className="help-card-hover rounded-2xl border bg-muted/30 p-4"
              >
                <Badge className="mb-3">Step {step.n}</Badge>
                <p className="mb-1 font-medium">{step.title}</p>
                <p className="mb-4 text-sm text-muted-foreground">{step.text}</p>
                <Link
                  href={step.href}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  {step.label}
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="pt-6 text-sm">
            <p className="font-medium text-emerald-800 dark:text-emerald-300">
              After setup: open Pull Requests → Sync from GitHub → Review
            </p>
            <p className="mt-1 text-muted-foreground">
              New changes on GitHub appear after you sync. Link a pull request to a
              feature so AI knows what plan to check against.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Team */}
      <section className="space-y-6">
        <SectionHeading
          id="team"
          icon={Users}
          title="Team & sharing"
          description="How workspaces, invites, and approvals keep everyone aligned"
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="help-card-hover">
            <CardHeader>
              <CardTitle className="text-base">Workspaces</CardTitle>
              <CardDescription>
                One workspace = one team or company. Data does not mix between workspaces.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Create a workspace from the Workspaces page.</p>
              <p>Invite teammates — they get an email link to join.</p>
              <p>Switch workspaces anytime from the sidebar footer.</p>
            </CardContent>
          </Card>

          <Card className="help-card-hover">
            <CardHeader>
              <CardTitle className="text-base">Human approvals</CardTitle>
              <CardDescription>
                AI suggests and checks — people decide what ships.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Approve the written plan before tasks are final.</p>
              <p>Approve the task plan before development starts.</p>
              <p>Give final release approval on the Release Approval page.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Billing */}
      <section className="space-y-6">
        <SectionHeading
          id="billing"
          icon={CreditCard}
          title="Plans & AI credits"
          description="What costs credits and how to get more"
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="help-card-hover border-primary/20">
            <CardHeader>
              <CardTitle className="text-base">Free plan</CardTitle>
              <CardDescription>Good for trying ShipFlow and small teams.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>Limited AI credits and repositories. Enough to learn the full flow.</p>
            </CardContent>
          </Card>

          <Card className="help-card-hover border-status-progress/30 bg-status-progress/5">
            <CardHeader>
              <CardTitle className="text-base">Pro plan</CardTitle>
              <CardDescription>More credits, repos, and room to grow.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>Upgrade from the Billing page when you need more AI runs or connected repos.</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Actions that use credits</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 sm:grid-cols-2">
              {[
                "AI clarifying questions",
                "Generating the plan document",
                "Creating tasks from a plan",
                "Reviewing a pull request",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm"
                >
                  <Sparkles className="size-3.5 shrink-0 text-status-warning" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* FAQ */}
      <section className="space-y-6">
        <SectionHeading
          id="faq"
          icon={CircleHelp}
          title="Common questions"
          description="Quick answers when something is unclear"
        />

        <Accordion>
          {faqItems.map((item, i) => (
            <AccordionItem key={item.q} value={`faq-${i}`}>
              <AccordionTrigger className="text-left font-medium">
                {item.q}
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">{item.a}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Footer CTA */}
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-r from-primary/5 to-status-progress/5">
        <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="help-float flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Rocket className="size-7" />
          </div>
          <div className="space-y-1">
            <p className="text-lg font-semibold">Ready to try it?</p>
            <p className="text-sm text-muted-foreground">
              Create your first feature request and follow the steps on screen.
            </p>
          </div>
          <Link
            href={`${DASHBOARD_BASE_PATH}/feature-requests`}
            className={buttonVariants()}
          >
            Go to Feature Requests
            <ArrowRight className="size-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
