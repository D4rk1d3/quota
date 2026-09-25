"use client";
import * as React from "react";
import type { DashboardSummary, Entitlement, Subscription } from "@/lib/types";

export interface QuotaData {
  subscriptions: Subscription[];
  dashboard: DashboardSummary;
  entitlement: Entitlement;
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
