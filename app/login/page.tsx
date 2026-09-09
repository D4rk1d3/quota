"use client";

import * as React from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendMagicLink, type SendMagicLinkState } from "@/lib/actions/auth";
import { Mail, CheckCircle2 } from "lucide-react";

const initialState: SendMagicLinkState = { status: "idle" };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(sendMagicLink, initialState);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--bg)] px-5">
      <div className="w-full max-w-[380px]">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent-soft)]">
            <Mail className="h-5 w-5 text-[var(--accent-strong)]" />
          </div>
          <h1 className="text-[20px] font-semibold tracking-[-0.015em] text-[var(--text-primary)]">
            Quota
          </h1>
          <p className="text-[13px] text-[var(--text-secondary)]">
            Accesso riservato all&apos;amministratore del gruppo Spotify Family.
          </p>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-elevated)]">
          {state.status === "sent" ? (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-strong)]" />
              <div>
                <p className="text-[13.5px] font-medium text-[var(--text-primary)]">Controlla la tua email</p>
                <p className="mt-1 text-[12.5px] text-[var(--text-secondary)]">{state.message}</p>
              </div>
            </div>
          ) : (
            <form action={formAction} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email amministratore</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@esempio.com"
                  autoComplete="email"
                  required
                />
              </div>
              {state.status === "error" && (
                <p className="text-[12.5px] text-[var(--danger,#B23A3A)]">{state.message}</p>
              )}
              <Button type="submit" disabled={pending} className="mt-1">
                {pending ? "Invio in corso…" : "Invia link di accesso"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
