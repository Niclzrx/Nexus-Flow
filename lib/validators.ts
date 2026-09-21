import { z } from "zod";

/** Validação server-side para todos os writes que vão para o Supabase.
 *  Impede overposting, valores absurdos e payloads maliciosos mesmo que
 *  o client seja burlado. O RLS continua como segunda barreira.
 */

const descricaoSchema = z
  .string()
  .trim()
  .min(1, "Descrição obrigatória")
  .max(120, "Descrição muito longa (máx 120)");

const categoriaSchema = z
  .string()
  .trim()
  .min(1, "Categoria obrigatória")
  .max(40, "Categoria muito longa");

const observacaoSchema = z
  .string()
  .trim()
  .max(500, "Observação muito longa")
  .nullable()
  .optional()
  .transform((v) => (v === "" ? null : v ?? null));

const paymentMethods = ["Pix", "Cartão de débito", "Cartão de crédito", "Dinheiro", "Boleto"] as const;

export const newTransactionSchema = z.object({
  tipo: z.enum(["entrada", "gasto"]),
  valor: z.number().positive("Valor deve ser > 0").max(1_000_000_000, "Valor muito alto"),
  descricao: descricaoSchema,
  categoria: categoriaSchema,
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve ser YYYY-MM-DD"),
  metodo: z.enum(paymentMethods).nullable().optional(),
  observacao: observacaoSchema,
  attachment_url: z.string().url("URL inválida").max(500).nullable().optional(),
  is_recurring: z.boolean().optional().default(false),
  recurrence_interval: z.enum(["weekly", "monthly", "yearly"]).nullable().optional(),
  recurrence_end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve ser YYYY-MM-DD").nullable().optional(),
  parent_id: z.string().uuid().nullable().optional(),
}).superRefine((data, ctx) => {
  if (data.is_recurring && !data.recurrence_interval) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["recurrence_interval"], message: "Intervalo obrigatório para recorrente" });
  }
  if (!data.is_recurring && data.recurrence_interval) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["recurrence_interval"], message: "Só defina intervalo se for recorrente" });
  }
});

export const updateTransactionSchema = z.object({
  id: z.string().uuid("ID inválido"),
  tipo: z.enum(["entrada", "gasto"]).optional(),
  valor: z.number().positive("Valor deve ser > 0").max(1_000_000_000, "Valor muito alto").optional(),
  descricao: descricaoSchema.optional(),
  categoria: categoriaSchema.optional(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve ser YYYY-MM-DD").optional(),
  metodo: z.enum(paymentMethods).nullable().optional(),
  observacao: observacaoSchema.optional(),
  attachment_url: z.string().url("URL inválida").max(500).nullable().optional(),
  is_recurring: z.boolean().optional(),
  recurrence_interval: z.enum(["weekly", "monthly", "yearly"]).nullable().optional(),
  recurrence_end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve ser YYYY-MM-DD").nullable().optional(),
  parent_id: z.string().uuid().nullable().optional(),
}).superRefine((data, ctx) => {
  if (data.is_recurring === true && !data.recurrence_interval) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["recurrence_interval"], message: "Intervalo obrigatório para recorrente" });
  }
  if (data.is_recurring === false && data.recurrence_interval) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["recurrence_interval"], message: "Só defina intervalo se for recorrente" });
  }
});

export const newGoalSchema = z.object({
  nome: z.string().trim().min(1, "Nome obrigatório").max(60, "Nome muito longo"),
  valor_meta: z.number().positive("Meta deve ser > 0").max(1_000_000_000, "Meta muito alta"),
  valor_guardado: z.number().min(0).max(1_000_000_000).optional(),
});

export const updateGoalSchema = newGoalSchema.partial().extend({
  id: z.string().uuid("ID inválido"),
});

export const newBudgetLimitSchema = z.object({
  categoria: categoriaSchema,
  limite: z.number().positive("Limite deve ser > 0").max(1_000_000_000, "Limite muito alto"),
  mes_referencia: z.string().regex(/^\d{4}-\d{2}$/, "Mês deve ser YYYY-MM"),
});

export const newShareSchema = z.object({
  titulo: z.string().trim().min(1, "Título obrigatório").max(80, "Título muito longo"),
  show_resumo: z.boolean(),
  show_grafico: z.boolean(),
  show_gastos_categoria: z.boolean(),
  expires_at: z.string().datetime({ offset: true }).nullable().optional().or(z.literal(null)),
});

export const profileUpdateSchema = z
  .object({
    nome: z.string().trim().max(60, "Nome muito longo").nullable().optional(),
    tema: z.enum(["dark", "light"]).optional(),
    saldo_inicial: z.number().min(-1_000_000_000).max(1_000_000_000).optional(),
  })
  .strict();

export const categoryNameSchema = z
  .string()
  .trim()
  .min(1, "Nome obrigatório")
  .max(40, "Nome muito longo")
  .regex(/^[^<>]*$/, "Caracteres < > não permitidos");
