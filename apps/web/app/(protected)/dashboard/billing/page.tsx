import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ensureWorkspaceAction } from "@/lib/actions/shipflow";

const plans = [
  {
    name: "Free",
    price: "₹0",
    features: ["2 repositories", "10 AI review credits/mo", "Basic workflow"],
  },
  {
    name: "Pro",
    price: "₹999/mo",
    features: ["Unlimited repos", "200 AI credits", "PRD + task agents", "Priority support"],
    highlighted: true,
  },
];

export default async function BillingPage() {
  const workspace = await ensureWorkspaceAction();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Workspace: {workspace.name} · Current plan: {workspace.plan}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((plan) => (
          <Card key={plan.name} className={plan.highlighted ? "border-violet-500" : undefined}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.price}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-1 text-sm text-muted-foreground">
                {plan.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              <Button variant={plan.highlighted ? "default" : "outline"} disabled={plan.name === "Free"}>
                {plan.name === "Free" ? "Current plan" : "Upgrade with Razorpay"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Usage</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          AI credits remaining: {workspace.aiCredits} · Repository limit: {workspace.repoLimit}
        </CardContent>
      </Card>
    </div>
  );
}
