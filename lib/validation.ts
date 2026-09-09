import { z } from "zod";

export const paymentMethods = [
  "bonifico",
  "revolut",
  "trade_republic",
  "contanti",
  "satispay",
] as const;

export const memberCreateSchema = z.object({
  name: z.string().trim().min(2, "Il nome deve avere almeno 2 caratteri").max(120),
  email: z.string().trim().email().optional(),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Colore non valido")
    .optional(),
  monthlyShareCents: z.number().int().positive().max(1_000_000).optional(),
  notes: z.string().trim().max(500).optional(),
});
export type MemberCreateInput = z.infer<typeof memberCreateSchema>;

export const memberUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().email().optional(),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  monthlyShareCents: z.number().int().positive().max(1_000_000).optional(),
  active: z.boolean().optional(),
  notes: z.string().trim().max(500).optional(),
});
export type MemberUpdateInput = z.infer<typeof memberUpdateSchema>;

export const memberIdSchema = z.object({ id: z.string().uuid() });

export const recordPaymentSchema = z.object({
  memberId: z.string().uuid(),
  amountCents: z
    .number()
    .int("L'importo deve essere in centesimi interi")
    .positive("L'importo deve essere maggiore di zero")
    .max(100_000, "Importo troppo alto"),
  method: z.enum(paymentMethods),
  paidAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data non valida"),
  note: z.string().trim().max(500).optional(),
});
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;

export const voidPaymentSchema = z.object({
  paymentId: z.string().uuid(),
  note: z.string().trim().min(3, "Spiega il motivo dell'annullamento").max(500),
});
export type VoidPaymentInput = z.infer<typeof voidPaymentSchema>;

export const updateSubscriptionSchema = z.object({
  monthlyCostCents: z.number().int().positive().max(1_000_000),
  billingDay: z.number().int().min(1).max(28),
  memberQuotaCents: z.number().int().positive().max(1_000_000),
});
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;

export const adjustPaymentSchema = z.object({
  paymentId: z.string().uuid(),
  deltaCents: z
    .number()
    .int("Il delta deve essere in centesimi interi")
    .refine((v) => v !== 0, "Il delta non può essere zero")
    .refine((v) => Math.abs(v) <= 100_000, "Delta troppo alto"),
  note: z.string().trim().min(3, "Spiega il motivo della rettifica").max(500),
});
export type AdjustPaymentInput = z.infer<typeof adjustPaymentSchema>;
