import { QuotaDataProvider } from "@/components/quota/quota-data-provider";
import { QuotaProvider } from "@/components/quota/quota-provider";
import { getDashboardSummary, getEntitlement, getSubscriptions, todayIso } from "@/lib/supabase/queries";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [subscriptions, dashboard, entitlement] = await Promise.all([
    getSubscriptions(),
    getDashboardSummary(),
    getEntitlement(),
  ]);

  return (
    <QuotaDataProvider
      data={{
        subscriptions,
        dashboard,
        entitlement,
        todayIso: todayIso(),
      }}
    >
      <QuotaProvider>{children}</QuotaProvider>
    </QuotaDataProvider>
  );
}
