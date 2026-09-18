import { PageShell } from "@/components/quota/page-shell";
import { EntitlementCard } from "@/components/quota/entitlement-card";
import { PaymentMethodsCard } from "@/components/quota/payment-methods-card";
import { ActivityFeed } from "@/components/quota/activity-feed";
import { getEntitlement, getPaymentMethods, getRecentActivity } from "@/lib/supabase/queries";

export default async function ImpostazioniPage() {
  const [entitlement, paymentMethods, activity] = await Promise.all([
    getEntitlement(),
    getPaymentMethods(),
    getRecentActivity(),
  ]);

  return (
    <PageShell title="Impostazioni" subtitle="Piano, metodi di pagamento e attività">
      <div className="flex max-w-xl flex-col gap-6">
        <EntitlementCard entitlement={entitlement} />
        <PaymentMethodsCard paymentMethods={paymentMethods} />
        <ActivityFeed entries={activity} />
      </div>
    </PageShell>
  );
}
