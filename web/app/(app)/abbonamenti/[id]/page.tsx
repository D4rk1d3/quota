import { notFound } from "next/navigation";
import { PageShell } from "@/components/quota/page-shell";
import { getPaymentMethods, getSubscriptionDetail } from "@/lib/supabase/queries";
import { SubscriptionDetailView } from "@/components/quota/subscription-detail-view";
import { BILLING_FREQUENCY_LABEL } from "@/lib/types";
import { formatEUR } from "@/lib/domain";

export default async function SubscriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [detail, paymentMethods] = await Promise.all([getSubscriptionDetail(id), getPaymentMethods()]);
  if (!detail) notFound();

  const { subscription } = detail;

  return (
    <PageShell
      title={subscription.name}
      subtitle={`${formatEUR(subscription.currentPrice, subscription.currency)} / ${BILLING_FREQUENCY_LABEL[
        subscription.billingFrequency
      ].toLowerCase()}`}
    >
      <SubscriptionDetailView detail={detail} paymentMethods={paymentMethods} />
    </PageShell>
  );
}
