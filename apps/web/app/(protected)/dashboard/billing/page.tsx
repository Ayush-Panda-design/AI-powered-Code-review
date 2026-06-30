import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UpgradeButton } from "@/features/billing/components/upgrade-button";
import { SectionGuideCard } from "@/features/dashboard/components/section-guide-card";
import {
  formatPlan,
  isDevelopmentEnvironment,
} from "@/features/dashboard/lib/user-facing-labels";
import { isRazorpayConfigured, isRazorpayProductionReady } from "@/lib/razorpay";
import { ensureWorkspaceAction } from "@/lib/actions/shipflow";
import { countConnectedRepositories } from "@repo/services";

const plans = [
  {
    name: "Free",
    price: "₹0",
    features: [
      "2 repositories",
      "10 AI review credits per month",
      "Full delivery workflow",
    ],
  },
  {
    name: "Pro",
    price: "₹999 / month",
    features: [
      "100 repositories",
      "200 AI credits per month",
      "Requirements docs & task planning",
      "Smarter code reviews against your plan",
      "Renews automatically each month",
    ],
    highlighted: true,
  },
];

export default async function BillingPage() {
  const workspace = await ensureWorkspaceAction();
  const razorpayReady = isRazorpayConfigured();
  const razorpayProductionReady = isRazorpayProductionReady();
  const isDevelopment = isDevelopmentEnvironment();
  const isPro = workspace.plan === "pro";
  const connectedRepos = await countConnectedRepositories(workspace.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Billing</h1>
        <p className="text-sm text-muted-foreground">
          {workspace.name} · {formatPlan(workspace.plan)} plan
        </p>
      </div>

      <SectionGuideCard section="billing" />

      {!razorpayReady && isDevelopment && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Developer setup</p>
            <p className="mt-2">
              Add payment keys in your local environment file to test Pro
              checkout. See the project setup guide for payment configuration.
            </p>
          </CardContent>
        </Card>
      )}

      {!razorpayReady && !isDevelopment && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Online upgrades are not available on this workspace yet. Contact
            support if you need to move to Pro.
          </CardContent>
        </Card>
      )}

      {razorpayReady && !isDevelopment && !razorpayProductionReady && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Your payment may take a moment to reflect. If checkout succeeds but
            your plan does not update, contact support with your receipt.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((plan) => {
          const isCurrent =
            (plan.name === "Free" && !isPro) || (plan.name === "Pro" && isPro);

          return (
            <Card
              key={plan.name}
              className={plan.highlighted ? "border-violet-500" : undefined}
            >
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.price}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {plan.features.map((feature) => (
                    <li key={feature}>• {feature}</li>
                  ))}
                </ul>
                {plan.name === "Free" ? (
                  <Button variant="outline" disabled={isCurrent}>
                    {isCurrent ? "Current plan" : "Contact support to change plan"}
                  </Button>
                ) : isCurrent ? (
                  <Button disabled>Current plan</Button>
                ) : (
                  <UpgradeButton
                    workspaceId={workspace.id}
                    disabled={!razorpayReady}
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Usage this month</CardTitle>
          <CardDescription>What your team has left on the current plan</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            AI credits remaining:{" "}
            <strong className="text-foreground">{workspace.aiCredits}</strong>
          </p>
          <p className="mt-1">
            Connected repositories:{" "}
            <strong className="text-foreground">
              {connectedRepos} of {workspace.repoLimit}
            </strong>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
