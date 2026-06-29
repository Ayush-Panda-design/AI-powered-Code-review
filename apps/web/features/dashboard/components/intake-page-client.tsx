"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Mail, Phone, Ticket } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DASHBOARD_BASE_PATH } from "@/features/dashboard/lib/routes";
import { trpc } from "@/trpc/client";

const sources = [
  { id: "email", label: "Email", icon: Mail },
  { id: "ticket", label: "Support ticket", icon: Ticket },
  { id: "call", label: "Customer call", icon: Phone },
] as const;

type IntakePageClientProps = {
  projectId: string;
  workspaceId: string;
};

export function IntakePageClient({ projectId, workspaceId }: IntakePageClientProps) {
  const router = useRouter();
  const [source, setSource] = useState<(typeof sources)[number]["id"]>("email");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const createMutation = trpc.featureRequest.create.useMutation({
    onSuccess: (feature) => {
      toast.success("Intake received — AI clarification is starting");
      router.push(`/dashboard/feature-requests/${feature.id}`);
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Customer intake</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Simulate email, support ticket, or call intake. ShipFlow creates a feature
          request and automatically starts AI clarification.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New intake</CardTitle>
          <CardDescription>
            Workspace-linked project intake for demo and external API parity.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {sources.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  type="button"
                  size="sm"
                  variant={source === item.id ? "default" : "outline"}
                  onClick={() => setSource(item.id)}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Button>
              );
            })}
          </div>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Customer request title"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What did the customer ask for?"
            className="min-h-32 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />

          <Button
            disabled={
              createMutation.isPending || title.trim().length < 3 || description.trim().length < 10
            }
            onClick={() =>
              createMutation.mutate({
                projectId,
                title: title.trim(),
                description: description.trim(),
                source,
              })
            }
          >
            Submit intake
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">External intake API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Production systems can POST to{" "}
            <code className="rounded bg-muted px-1">/api/intake/feature-request</code> with
            bearer auth and the same fields. Workspace id:{" "}
            <code className="rounded bg-muted px-1">{workspaceId}</code>
          </p>
          <Link
            href={`${DASHBOARD_BASE_PATH}/feature-requests`}
            className="text-primary underline-offset-4 hover:underline"
          >
            View all feature requests
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
