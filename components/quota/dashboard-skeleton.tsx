import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-[220px] w-full rounded-[var(--radius-card)]" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[104px] rounded-[var(--radius-card)]" />
        ))}
      </div>
      <Card className="p-4">
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-3.5 w-1/3 rounded-full" />
                <Skeleton className="mt-2 h-3 w-1/4 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
