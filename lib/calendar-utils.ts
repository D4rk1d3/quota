import type { ActivityItem, Payment, SpotifyPlan } from "./types";

export interface CalendarEvent {
  id: string;
  day: number;
  kind: "charge" | "payment" | "reminder";
  label: string;
  detail: string;
  amount?: number;
}

export interface CalendarDay {
  date: Date;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
export { WEEKDAY_LABELS };

function mondayIndex(jsDay: number) {
  // JS: 0=Dom..6=Sab -> convert to Lun(0)..Dom(6)
  return (jsDay + 6) % 7;
}

export function getEventsForMonth(
  year: number,
  month: number,
  data: { plan: SpotifyPlan; payments: Payment[]; activity: ActivityItem[]; memberName: (id: string) => string }
): Record<number, CalendarEvent[]> {
  const { plan, payments, activity, memberName } = data;
  const map: Record<number, CalendarEvent[]> = {};
  const push = (day: number, ev: CalendarEvent) => {
    map[day] = map[day] ? [...map[day], ev] : [ev];
  };

  push(plan.billingDay, {
    id: `charge-${year}-${month}`,
    day: plan.billingDay,
    kind: "charge",
    label: `Spotify · ${plan.monthlyCost.toFixed(2).replace(".", ",")} €`,
    detail: "Addebito ricorrente del piano Family",
    amount: plan.monthlyCost,
  });

  payments.forEach((p) => {
    const d = new Date(p.date + "T00:00:00");
    if (d.getFullYear() === year && d.getMonth() === month) {
      const name = memberName(p.memberId);
      push(d.getDate(), {
        id: `payment-${p.id}`,
        day: d.getDate(),
        kind: "payment",
        label: `${name} ha pagato`,
        detail: `${p.amount.toFixed(2).replace(".", ",")} € · ${name}`,
        amount: p.amount,
      });
    }
  });

  activity.forEach((a) => {
    if (a.type !== "reminder") return;
    const d = new Date(a.date + "T00:00:00");
    if (d.getFullYear() === year && d.getMonth() === month) {
      push(d.getDate(), {
        id: `reminder-${a.id}`,
        day: d.getDate(),
        kind: "reminder",
        label: "Promemoria inviato",
        detail: a.description,
      });
    }
  });

  return map;
}

export function getMonthMatrix(
  year: number,
  month: number,
  today: Date,
  data: { plan: SpotifyPlan; payments: Payment[]; activity: ActivityItem[]; memberName: (id: string) => string }
): CalendarDay[][] {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = mondayIndex(firstOfMonth.getDay());
  const gridStart = new Date(year, month, 1 - startOffset);
  const events = getEventsForMonth(year, month, data);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  const weeks: CalendarDay[][] = [];
  let cursor = new Date(gridStart);
  for (let i = 0; i < totalCells; i++) {
    const inMonth = cursor.getMonth() === month;
    const day: CalendarDay = {
      date: new Date(cursor),
      day: cursor.getDate(),
      inMonth,
      isToday:
        cursor.getFullYear() === today.getFullYear() &&
        cursor.getMonth() === today.getMonth() &&
        cursor.getDate() === today.getDate(),
      events: inMonth ? events[cursor.getDate()] ?? [] : [],
    };
    if (i % 7 === 0) weeks.push([]);
    weeks[weeks.length - 1].push(day);
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
  }
  return weeks;
}

export const MONTH_LABELS = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];
