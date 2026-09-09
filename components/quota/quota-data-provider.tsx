"use client";
import * as React from "react";
import type {
  ActivityItem,
  FundState,
  Member,
  NotificationPreferences,
  Payment,
  SpotifyPlan,
} from "@/lib/types";

export interface QuotaData {
  members: Member[];
  payments: Payment[];
  activity: ActivityItem[];
  fund: FundState;
  plan: SpotifyPlan;
  notificationPreferences: NotificationPreferences;
  /** ISO date (yyyy-mm-dd), calcolata lato server con la data reale del server. */
  todayIso: string;
}

const QuotaDataContext = React.createContext<QuotaData | null>(null);

export function QuotaDataProvider({
  data,
  children,
}: {
  data: QuotaData;
  children: React.ReactNode;
}) {
  return <QuotaDataContext.Provider value={data}>{children}</QuotaDataContext.Provider>;
}

export function useQuotaData() {
  const ctx = React.useContext(QuotaDataContext);
  if (!ctx) throw new Error("useQuotaData deve essere usato dentro QuotaDataProvider");
  return ctx;
}

export function useToday(): Date {
  const { todayIso } = useQuotaData();
  return new Date(todayIso + "T00:00:00");
}

export function useMemberName() {
  const { members } = useQuotaData();
  return React.useCallback(
    (id: string) => members.find((m) => m.id === id)?.name ?? "Membro",
    [members]
  );
}
