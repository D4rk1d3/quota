import { QuotaDataProvider } from "@/components/quota/quota-data-provider";
import { QuotaProvider } from "@/components/quota/quota-provider";
import {
  getActivity,
  getFundState,
  getMembersWithCoverage,
  getSubscriptionPlan,
} from "@/lib/supabase/queries";
import { getAllPayments } from "@/lib/supabase/queries";
import { NOTIFICATION_PREFERENCES } from "@/lib/notification-config";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [{ members, asOf }, fund, plan, activity, payments] = await Promise.all([
    getMembersWithCoverage(),
    getFundState(),
    getSubscriptionPlan(),
    getActivity(20),
    getAllPayments(),
  ]);

  return (
    <QuotaDataProvider
      data={{
        members,
        payments,
        activity,
        fund,
        plan,
        notificationPreferences: NOTIFICATION_PREFERENCES,
        todayIso: asOf,
      }}
    >
      <QuotaProvider>{children}</QuotaProvider>
    </QuotaDataProvider>
  );
}
