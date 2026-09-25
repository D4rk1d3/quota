import { PageShell } from "@/components/quota/page-shell";
import { DashboardSkeleton } from "@/components/quota/dashboard-skeleton";

export default function Loading() {
  return (
    <PageShell title="Quota" subtitle="Caricamento…">
      <DashboardSkeleton />
    </PageShell>
  );
}
