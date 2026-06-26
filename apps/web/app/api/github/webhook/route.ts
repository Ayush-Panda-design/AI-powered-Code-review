import { handleGitHubWebhook } from "@/features/github/server/webhook-handler";

export async function GET() {
  return Response.json({
    ok: true,
    route: "/api/github/webhook",
    message: "GitHub webhook endpoint is reachable. GitHub sends POST requests here.",
  });
}

export async function POST(request: Request) {
  return handleGitHubWebhook(request);
}
