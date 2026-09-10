// Tipi di dominio per Quota. Nessuna dipendenza da backend:
// questo file è la "fonte di verità" dei dati che l'adapter mock implementa.

export type PaymentMethod =
  | "bonifico"
  | "revolut"
  | "trade_republic"
  | "contanti"
  | "satispay";

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  bonifico: "Bonifico",
  revolut: "Revolut",
  trade_republic: "Trade Republic",
  contanti: "Contanti",
  satispay: "Satispay",
};

export type MemberStatus = "regolare" | "in_scadenza" | "in_ritardo";

export const MEMBER_STATUS_LABEL: Record<MemberStatus, string> = {
  regolare: "In regola",
  in_scadenza: "In scadenza",
  in_ritardo: "In ritardo",
};

export interface Member {
  id: string;
  name: string;
  monthlyShare: number; // quota mensile in euro
  coveredUntil: string; // ISO date — fino a quando il membro ha già pagato
  lastPaymentDate: string | null; // ISO date
  lastPaymentAmount: number | null;
  status: MemberStatus;
  joinedAt: string; // ISO date
  color: string; // colore avatar iniziali
}

export interface Payment {
  id: string;
  memberId: string;
  amount: number;
  date: string; // ISO date
  method: PaymentMethod;
  note?: string;
  coversUntil: string; // ISO date derivata dal pagamento
  voided?: boolean; // true se esiste già uno storno (kind='void') per questo pagamento
}

export type ActivityType = "payment" | "reminder" | "member_added" | "charge";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  memberId?: string;
  date: string; // ISO date
  amount?: number;
  description: string;
}

export interface SpotifyPlan {
  planName: string;
  monthlyCost: number;
  billingDay: number; // giorno del mese, es. 5
  perMemberShare: number;
  adminPaymentMethod: PaymentMethod;
}

export interface NotificationPreferences {
  remindBeforeDue: boolean;
  daysBefore: number;
  notifyOnLatePayment: boolean;
  notifyOnPaymentReceived: boolean;
  weeklySummary: boolean;
}

export interface FundState {
  balance: number; // saldo del fondo Spotify
  collectedThisCycle: number;
  expectedThisCycle: number;
  toRecover: number;
  membersInGoodStanding: number;
  totalMembers: number;
}
