"use client";
import * as React from "react";
import { Toaster } from "@/components/ui/sonner";

export function QuotaProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
