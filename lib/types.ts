// Tipi di dominio per Quota. Rispecchiano lo schema reale (progetto
// Supabase nsxgzemqcsetxggmujdc): niente piu' centesimi interi, gli importi
// sono numeric (euro) gia' nel DB — vedi lib/supabase/database.types.ts.

export type BillingFrequency = "monthly" | "quarterly" | "yearly" | "custom";
export const BILLING_FREQUENCY_LABEL: Record<BillingFrequency, string> = {
  monthly: "Mensile",
  quarterly: "Trimestrale",
  yearly: "Annuale",
  custom: "Personalizzato",
};

export type ShareType = "equal" | "fixed" | "percentage";
export const SHARE_TYPE_LABEL: Record<ShareType, string> = {
  equal: "In parti uguali",
  fixed: "Importo fisso a persona",
  percentage: "Percentuale a persona",
};

export type SubscriptionStatus = "active" | "paused" | "cancelled" | "archived";
export type MemberStatus = "active" | "paused" | "removed";
export type CycleStatus = "upcoming" | "current" | "overdue" | "closed";
export type PaymentStatus = "active" | "reversed";
export type ChargeStatus = "scheduled" | "partial" | "paid" | "overdue" | "credit";

export const CHARGE_STATUS_LABEL: Record<ChargeStatus, string> = {
  scheduled: "Da pagare",
  partial: "Parziale",
  paid: "Pagato",
  overdue: "In ritardo",
  credit: "Credito",
};

export interface Subscription {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  currency: string;
  currentPrice: number;
  billingFrequency: BillingFrequency;
  billingInterval: number;
  shareType: ShareType;
  nextRenewalDate: string;
  startDate: string;
  status: SubscriptionStatus;
  memberCount?: number;
}

export interface SubscriptionMember {
  id: string;
  subscriptionId: string;
  name: string;
  email: string | null;
  phone: string | null;
  initials: string | null;
  avatarColor: string | null;
  defaultShare: number | null;
  status: MemberStatus;
  pauseFrom: string | null;
  pauseUntil: string | null;
  joinedAt: string;
}

export interface BillingCycle {
  id: string;
  subscriptionId: string;
  periodStart: string;
  periodEnd: string;
  renewalDate: string;
  priceAtCycle: number;
  currency: string;
  expectedTotal: number;
  collectedTotal: number;
  status: CycleStatus;
}

export interface MemberCharge {
  id: string;
  billingCycleId: string;
  memberId: string;
  memberName: string;
  expectedAmount: number;
  currency: string;
  dueDate: string;
  totalPaid: number;
  remainingAmount: number;
  status: ChargeStatus;
}

export type PaymentMethodType =
  | "revolut"
  | "bank_transfer"
  | "cash"
  | "satispay"
  | "trade_republic"
  | "paypal"
  | "other";

export const PAYMENT_METHOD_LABEL: Record<PaymentMethodType, string> = {
  revolut: "Revolut",
  bank_transfer: "Bonifico",
  cash: "Contanti",
  satispay: "Satispay",
  trade_republic: "Trade Republic",
  paypal: "PayPal",
  other: "Altro",
};

export interface PaymentMethod {
  id: string;
  label: string;
  methodType: PaymentMethodType;
  isDefault: boolean;
}

export interface Payment {
  id: string;
  chargeId: string;
  memberId: string;
  amount: number;
  currency: string;
  paymentMethodId: string | null;
  paidAt: string;
  note: string | null;
  status: PaymentStatus;
}

export interface DashboardSummary {
  totalExpected: number;
  totalCollected: number;
  totalOutstanding: number;
  paymentsCount: number;
  overdueCount: number;
  nextRenewalDate: string | null;
  nextRenewalSubscription: string | null;
}

export type EntitlementStatus = "free" | "active" | "past_due" | "cancelled" | "expired";

export interface Entitlement {
  isPro: boolean;
  status: EntitlementStatus;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

/** Limiti del tier gratuito — applicati lato server (vedi lib/actions/subscriptions.ts). */
export const FREE_TIER_LIMITS = {
  maxSubscriptions: 1,
  maxMembersPerSubscription: 6,
} as const;
