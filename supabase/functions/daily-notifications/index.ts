// Quota — job giornaliero idempotente di notifiche.
//
// Genera (e invia via email all'admin) quattro tipi di notifica:
//   1. charge_reminder_3d  — 3 giorni prima dell'addebito del giorno 5
//   2. charge_due          — il giorno dell'addebito
//   3. member_uncovered    — un membro non copre ancora il ciclo in arrivo
//   4. coverage_ending_soon— la copertura di un membro termina entro 7 giorni
//
// Idempotenza: ogni notifica ha una idempotency_key deterministica
// (tipo + data/membro coinvolti). Il job puo' essere invocato piu' volte
// nello stesso giorno (retry del cron, run manuale) senza generare
// duplicati: prima di inserire, verifica quali chiavi esistono gia'.
//
// Invocazione prevista: pg_cron -> pg_net http POST con
// Authorization: Bearer <service_role key> (vedi migrazione
// 20260909141000_notifications_cron.sql). Nessun segreto e' letto dal
// client Next.js: questa funzione gira solo lato Supabase.

import { createClient } from "jsr:@supabase/supabase-js@2";
import { getEmailProvider } from "./_shared/email.ts";

const BUSINESS_TIMEZONE = "Europe/Rome";

function todayIsoInTz(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const d = parts.find((p) => p.type === "day")!.value;
  return `${y}-${m}-${d}`;
}

function parseIso(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
}

/** Aggiunge un mese a "YYYY-MM-DD" (stringa pura, nessun fuso orario coinvolto). */
function addOneMonth(iso: string): string {
  const { y, m, d } = parseIso(iso);
  const nextMonth = m === 12 ? 1 : m + 1;
  const nextYear = m === 12 ? y + 1 : y;
  return `${nextYear}-${String(nextMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Differenza in giorni tra due date "YYYY-MM-DD" (b - a), via UTC esplicito. */
function daysBetween(aIso: string, bIso: string): number {
  const a = parseIso(aIso);
  const b = parseIso(bIso);
  const aMs = Date.UTC(a.y, a.m - 1, a.d);
  const bMs = Date.UTC(b.y, b.m - 1, b.d);
  return Math.round((bMs - aMs) / (1000 * 60 * 60 * 24));
}

function formatEuro(cents: number): string {
  return (cents / 100).toLocaleString("it-IT", { style: "currency", currency: "EUR" });
}

function formatDayMonth(iso: string): string {
  const { y, m, d } = parseIso(iso);
  return new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d))
  );
}

interface NotificationRow {
  type: "charge_reminder_3d" | "charge_due" | "member_uncovered" | "coverage_ending_soon";
  member_id: string | null;
  cycle_date: string | null;
  title: string;
  body: string;
  idempotency_key: string;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const adminEmail = Deno.env.get("NOTIFICATIONS_TO_EMAIL") ?? Deno.env.get("ADMIN_EMAIL");

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const today = todayIsoInTz();

  const { data: subscription, error: subErr } = await supabase
    .from("subscriptions")
    .select("start_date, billing_day, monthly_cost_cents")
    .eq("active", true)
    .single();

  if (subErr || !subscription) {
    return Response.json({ ok: false, error: "nessun piano attivo configurato" }, { status: 500 });
  }

  // Prossimo ciclo di addebito >= oggi
  let nextCharge = subscription.start_date as string;
  while (nextCharge < today) {
    nextCharge = addOneMonth(nextCharge);
  }
  const daysUntilCharge = daysBetween(today, nextCharge);

  const candidates: NotificationRow[] = [];

  if (daysUntilCharge === 3) {
    candidates.push({
      type: "charge_reminder_3d",
      member_id: null,
      cycle_date: nextCharge,
      title: "Addebito Spotify tra 3 giorni",
      body: `Il ${formatDayMonth(nextCharge)} Spotify addebitera' ${formatEuro(
        subscription.monthly_cost_cents
      )} per il piano Family.`,
      idempotency_key: `charge_reminder_3d:${nextCharge}`,
    });
  }

  if (daysUntilCharge === 0) {
    candidates.push({
      type: "charge_due",
      member_id: null,
      cycle_date: nextCharge,
      title: "Addebito Spotify oggi",
      body: `Oggi Spotify addebita ${formatEuro(subscription.monthly_cost_cents)} per il piano Family.`,
      idempotency_key: `charge_due:${nextCharge}`,
    });
  }

  const { data: members, error: membersErr } = await supabase
    .from("members")
    .select("id, name")
    .eq("active", true);

  if (membersErr) {
    return Response.json({ ok: false, error: membersErr.message }, { status: 500 });
  }

  for (const member of members ?? []) {
    const { data: coverageRows, error: covErr } = await supabase.rpc("member_coverage", {
      p_member_id: member.id,
      p_as_of: today,
    });
    if (covErr) continue;
    const coverage = coverageRows?.[0];
    if (!coverage) continue;

    const coveredUntil = coverage.covered_until as string;

    if (coveredUntil <= nextCharge) {
      candidates.push({
        type: "member_uncovered",
        member_id: member.id,
        cycle_date: nextCharge,
        title: `${member.name} non copre ancora il prossimo ciclo`,
        body: `${member.name} e' coperto solo fino al ${formatDayMonth(
          coveredUntil
        )}, prima del prossimo addebito del ${formatDayMonth(nextCharge)}.`,
        idempotency_key: `member_uncovered:${member.id}:${nextCharge}`,
      });
    } else if (daysBetween(today, coveredUntil) <= 7) {
      candidates.push({
        type: "coverage_ending_soon",
        member_id: member.id,
        cycle_date: coveredUntil,
        title: `Copertura di ${member.name} in scadenza`,
        body: `${member.name} e' coperto fino al ${formatDayMonth(coveredUntil)}: meno di 7 giorni.`,
        idempotency_key: `coverage_ending_soon:${member.id}:${coveredUntil}`,
      });
    }
  }

  let insertedCount = 0;

  if (candidates.length > 0) {
    const keys = candidates.map((c) => c.idempotency_key);
    const { data: existing, error: existingErr } = await supabase
      .from("notifications")
      .select("idempotency_key")
      .in("idempotency_key", keys);

    if (existingErr) {
      return Response.json({ ok: false, error: existingErr.message }, { status: 500 });
    }

    const existingKeys = new Set((existing ?? []).map((r) => r.idempotency_key));
    const toInsert = candidates.filter((c) => !existingKeys.has(c.idempotency_key));

    if (toInsert.length > 0) {
      const { data: inserted, error: insertErr } = await supabase
        .from("notifications")
        .insert(toInsert)
        .select("id");

      if (insertErr) {
        return Response.json({ ok: false, error: insertErr.message }, { status: 500 });
      }
      insertedCount = inserted?.length ?? 0;
    }
  }

  // Non solo le notifiche appena create: anche quelle di run precedenti la
  // cui email non e' mai partita (provider giu', Resend non configurato al
  // momento, errore transitorio) vengono ritentate qui. Idempotenza
  // dell'invio = email_sent_at, non "e' stata appena creata".
  const { data: unsent, error: unsentErr } = await supabase
    .from("notifications")
    .select("id, title, body")
    .is("email_sent_at", null)
    .order("created_at", { ascending: true })
    .limit(50);

  if (unsentErr) {
    return Response.json({ ok: false, error: unsentErr.message }, { status: 500 });
  }

  let emailSent = false;
  let emailError: string | undefined;

  if (adminEmail && unsent && unsent.length > 0) {
    const provider = getEmailProvider();
    const html =
      `<h2>Quota — ${unsent.length} notifica/e</h2><ul>` +
      unsent.map((n) => `<li><strong>${n.title}</strong><br/>${n.body}</li>`).join("") +
      "</ul>";
    const text = unsent.map((n) => `${n.title}\n${n.body}`).join("\n\n");

    const result = await provider.send({
      to: adminEmail,
      subject: `Quota — ${unsent.length} notifica/e`,
      html,
      text,
    });

    if (result.ok) {
      emailSent = true;
      await supabase
        .from("notifications")
        .update({ email_sent_at: new Date().toISOString() })
        .in(
          "id",
          unsent.map((n) => n.id)
        );
    } else {
      emailError = result.error;
    }
  }

  return Response.json({
    ok: true,
    today,
    nextCharge,
    created: insertedCount,
    pendingEmail: unsent?.length ?? 0,
    emailSent,
    ...(emailError ? { emailError } : {}),
    ...(!adminEmail ? { warning: "NOTIFICATIONS_TO_EMAIL/ADMIN_EMAIL non configurata" } : {}),
  });
});
