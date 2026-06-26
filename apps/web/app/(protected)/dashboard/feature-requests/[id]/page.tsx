import { FeatureRequestDetailClient } from "@/features/shipflow/components/feature-request-detail-client";
import { getFeatureRequest } from "@repo/services";
import { notFound } from "next/navigation";

export default async function FeatureRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const feature = await getFeatureRequest(id);
  if (!feature) notFound();

  return <FeatureRequestDetailClient featureId={id} />;
}
