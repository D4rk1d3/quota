import { z } from "zod";

export const paymentMethodTypes = [
  "revolut",
  "bank_transfer",
  "cash",
  "satispay",
  "trade_republic",
  "paypal",
  "other",
] as const;

export const billingFrequencies = ["monthly", "quarterly", "yearly", "custom"] as const;
export const shareTypes = ["equal", "fixed", "percentage"] as const;

export const subscriptionCreateSchema = z.object({
  name: z.string().trim().min(1, "Il nome è obbligatorio").max(120),
  description: z.string().trim().max(500).optional(),
  icon: z.string().trim().max(50).optional(),
  currentPrice: z.number().positive("Il prezzo deve essere positivo").max(1_000_000),
  billingFrequency: z.enum(billingFrequencies),
  billingInterval: z.number().int().positive().max(36).default(1),
  shareType: z.enum(shareTypes),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data non valida"),
});
export type SubscriptionCreateInput = z.infer<typeof subscriptionCreateSchema>;

export const subscriptionUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(500).optional(),
  currentPrice: z.number().positive().max(1_000_000).optional(),
  status: z.enum(["active", "paused", "cancelled", "archived"]).optional(),
});
export type SubscriptionUpdateInput = z.infer<typeof subscriptionUpdateSchema>;

export const memberCreateSchema = z.object({
  subscriptionId: z.string().uuid(),
  name: z.string().trim().min(1, "Il nome è obbligatorio").max(120),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional(),
  avatarColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Colore non valido")
    .optional(),
  defaultShare: z.number().positive().max(1_000_000).optional(),
});
export type MemberCreateInput = z.infer<typeof memberCreateSchema>;

export const memberUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(120).optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional(),
  defaultShare: z.number().positive().max(1_000_000).optional(),
  status: z.enum(["active", "paused", "removed"]).optional(),
});
export type MemberUpdateInput = z.infer<typeof memberUpdateSchema>;

export const recordPaymentSchema = z.object({
  chargeId: z.string().uuid(),
  amount: z.number().positive("L'importo deve essere positivo").max(100_000),
  paymentMethodId: z.string().uuid().optional(),
  paidAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data non valida").optional(),
  note: z.string().trim().max(500).optional(),
});
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;

export const reversePaymentSchema = z.object({
  paymentId: z.string().uuid(),
  reason: z.string().trim().min(3, "Spiega il motivo dello storno").max(500),
});
export type ReversePaymentInput = z.infer<typeof reversePaymentSchema>;

export const paymentMethodCreateSchema = z.object({
  label: z.string().trim().min(1, "Serve un nome per il metodo").max(120),
  methodType: z.enum(paymentMethodTypes),
  isDefault: z.boolean().optional(),
});
export type PaymentMethodCreateInput = z.infer<typeof paymentMethodCreateSchema>;
