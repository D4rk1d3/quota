import type { NotificationPreferences } from "./types";

// Le regole di notifica sono fisse (vedi supabase/functions/daily-notifications
// e le regole di business del progetto): 3 giorni prima dell'addebito, il
// giorno dell'addebito, quando un membro non copre il ciclo in arrivo, e
// quando una copertura termina entro 7 giorni. Non sono configurabili
// dall'admin — questo oggetto serve solo per mostrarle nella UI.
export const NOTIFICATION_PREFERENCES: NotificationPreferences = {
  remindBeforeDue: true,
  daysBefore: 3,
  notifyOnLatePayment: true,
  notifyOnPaymentReceived: false,
  weeklySummary: false,
};
