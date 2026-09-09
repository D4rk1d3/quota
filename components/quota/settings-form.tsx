"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useQuotaData } from "@/components/quota/quota-data-provider";
import { formatEUR } from "@/lib/domain";
import { euroToCents } from "@/lib/adapters";
import { updateSubscription } from "@/lib/actions/subscription";
import { Bell, CalendarClock, UserX, Wallet } from "lucide-react";

const NOTIFICATION_RULES = [
  {
    icon: CalendarClock,
    title: "3 giorni prima dell'addebito",
    description: "Promemoria in-app + email il giorno prima della finestra di addebito Spotify.",
  },
  {
    icon: Bell,
    title: "Il giorno dell'addebito",
    description: "Notifica il giorno 5 di ogni mese, quando Spotify addebita il piano Family.",
  },
  {
    icon: UserX,
    title: "Membro non coperto",
    description: "Avviso quando un membro non copre ancora il ciclo che sta per iniziare.",
  },
  {
    icon: Wallet,
    title: "Copertura in scadenza",
    description: "Avviso quando la copertura di un membro termina entro 7 giorni.",
  },
];

export function SettingsForm() {
  const router = useRouter();
  const { plan, fund } = useQuotaData();

  const [cost, setCost] = React.useState(plan.monthlyCost.toFixed(2).replace(".", ","));
  const [billingDay, setBillingDay] = React.useState(String(plan.billingDay));
  const [share, setShare] = React.useState(plan.perMemberShare.toFixed(2).replace(".", ","));
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const numericCost = parseFloat(cost.replace(",", ".")) || 0;
  const numericShare = parseFloat(share.replace(",", ".")) || 0;
  const totalCollected = numericShare * fund.totalMembers;
  const roundingSurplus = totalCollected - numericCost;

  async function handleSave() {
    setSaving(true);
    setError(null);

    const result = await updateSubscription({
      monthlyCostCents: euroToCents(numericCost),
      billingDay: Number(billingDay),
      memberQuotaCents: euroToCents(numericShare),
    });

    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    router.refresh();
    toast.success("Impostazioni salvate");
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Piano Spotify Family</CardTitle>
          <CardDescription>Dati del piano condiviso.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label>Piano</Label>
            <div className="flex h-11 items-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-muted)] px-4 text-[14px] text-[var(--text-secondary)]">
              {plan.planName}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="cost">Costo mensile</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[14px] text-[var(--text-tertiary)]">€</span>
                <Input id="cost" className="pl-8" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="billing-day">Giorno di addebito</Label>
              <Select value={billingDay} onValueChange={setBillingDay}>
                <SelectTrigger id="billing-day">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      Giorno {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="share">Quota per membro</Label>
            <div className="relative max-w-[200px]">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[14px] text-[var(--text-tertiary)]">€</span>
              <Input id="share" className="pl-8" inputMode="decimal" value={share} onChange={(e) => setShare(e.target.value)} />
            </div>
          </div>

          {error && <p className="text-[12.5px] text-[var(--danger,#B23A3A)]">{error}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-[var(--accent-strong)]" />
            <CardTitle>Notifiche automatiche</CardTitle>
          </div>
          <CardDescription>
            Il job giornaliero genera queste notifiche in-app e via email; non sono configurabili.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {NOTIFICATION_RULES.map((rule) => (
            <div key={rule.title} className="flex items-start gap-3 py-3">
              <rule.icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-tertiary)]" />
              <div>
                <p className="text-[13.5px] font-medium text-[var(--text-primary)]">{rule.title}</p>
                <p className="mt-0.5 text-[12.5px] text-[var(--text-tertiary)]">{rule.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-[var(--accent-strong)]" />
            <CardTitle>Fondo Spotify</CardTitle>
          </div>
          <CardDescription>Il saldo accantonato dagli arrotondamenti delle quote.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-[var(--radius-md)] bg-[var(--surface-muted)] p-5">
            <p className="text-[12.5px] text-[var(--text-secondary)]">Saldo attuale</p>
            <p className="mt-1 text-[26px] font-semibold tracking-[-0.015em] text-[var(--text-primary)]">
              {formatEUR(fund.balance)}
            </p>
          </div>
          <p className="mt-4 text-[12.5px] leading-relaxed text-[var(--text-tertiary)]">
            {fund.totalMembers} membri × {formatEUR(numericShare)} = {formatEUR(totalCollected)} raccolti ogni ciclo,
            a fronte di un costo reale di {formatEUR(numericCost)}. L&apos;eccedenza di{" "}
            <strong className="text-[var(--text-secondary)]">{formatEUR(Math.max(roundingSurplus, 0))}</strong> per
            ciclo si accumula nel fondo e copre eventuali arrotondamenti futuri.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button size="lg" onClick={handleSave} disabled={saving}>
          {saving ? "Salvataggio…" : "Salva modifiche"}
        </Button>
      </div>
    </div>
  );
}
