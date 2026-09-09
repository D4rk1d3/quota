"use client";
import * as React from "react";
import { RegisterPaymentSheet } from "@/components/quota/register-payment-sheet";
import { Toaster } from "@/components/ui/sonner";

interface QuotaContextValue {
  openRegisterPayment: (memberId?: string) => void;
}

const QuotaContext = React.createContext<QuotaContextValue | null>(null);

export function useQuotaActions() {
  const ctx = React.useContext(QuotaContext);
  if (!ctx) throw new Error("useQuotaActions deve essere usato dentro QuotaProvider");
  return ctx;
}

export function QuotaProvider({ children }: { children: React.ReactNode }) {
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [memberId, setMemberId] = React.useState<string | undefined>(undefined);

  const openRegisterPayment = React.useCallback((id?: string) => {
    setMemberId(id);
    setSheetOpen(true);
  }, []);

  return (
    <QuotaContext.Provider value={{ openRegisterPayment }}>
      {children}
      <RegisterPaymentSheet open={sheetOpen} onOpenChange={setSheetOpen} defaultMemberId={memberId} />
      <Toaster />
    </QuotaContext.Provider>
  );
}
