import { PageShell } from "@/components/quota/page-shell";
import { EntitlementCard } from "@/components/quota/entitlement-card";
import { PaymentMethodsCard } from "@/components/quota/payment-methods-card";
import { getEntitlement, getPaymentMethods } from "@/lib/supabase/queries";

export default async function ImpostazioniPage() {
  const [entitlement, paymentMethods] = await Promise.all([getEntitlement(), getPaymentMethods()]);

  return (
    <PageShell title="Impostazioni" subtitle="Piano e metodi di pagamento">
      <div className="flex max-w-xl flex-col gap-6">
        <EntitlementCard entitlement={entitlement} />
        <PaymentMethodsCard paymentMethods={paymentMethods} />
      </div>
    </PageShell>
  );
}
