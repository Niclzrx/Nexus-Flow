import type { BudgetLimit, Category, Goal, Transaction } from "@/types";

const uid = "mock-user";
const now = new Date().toISOString();

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: "t1", user_id: uid, tipo: "entrada", valor: 1200, descricao: "Pagamento cliente", categoria: "Freelance", data: "2026-09-09", metodo: "Pix", observacao: null, attachment_url: null, is_recurring: false, recurrence_interval: null, recurrence_end_date: null, parent_id: null, created_at: now },
  { id: "t2", user_id: uid, tipo: "gasto", valor: 25, descricao: "Almoço", categoria: "Alimentação", data: "2026-09-09", metodo: "Cartão de débito", observacao: null, attachment_url: null, is_recurring: false, recurrence_interval: null, recurrence_end_date: null, parent_id: null, created_at: now },
  { id: "t3", user_id: uid, tipo: "gasto", valor: 15, descricao: "Uber", categoria: "Transporte", data: "2026-09-09", metodo: "Pix", observacao: null, attachment_url: null, is_recurring: false, recurrence_interval: null, recurrence_end_date: null, parent_id: null, created_at: now },
  { id: "t4", user_id: uid, tipo: "gasto", valor: 89.9, descricao: "Assinatura Figma", categoria: "Tecnologia", data: "2026-09-08", metodo: "Cartão de crédito", observacao: null, attachment_url: null, is_recurring: true, recurrence_interval: "monthly", recurrence_end_date: null, parent_id: null, created_at: now },
  { id: "t5", user_id: uid, tipo: "gasto", valor: 42.6, descricao: "Mercado", categoria: "Casa", data: "2026-09-07", metodo: "Cartão de débito", observacao: null, attachment_url: null, is_recurring: false, recurrence_interval: null, recurrence_end_date: null, parent_id: null, created_at: now },
  { id: "t6", user_id: uid, tipo: "gasto", valor: 60, descricao: "Cinema", categoria: "Lazer", data: "2026-09-06", metodo: "Pix", observacao: null, attachment_url: null, is_recurring: false, recurrence_interval: null, recurrence_end_date: null, parent_id: null, created_at: now },
  { id: "t7", user_id: uid, tipo: "gasto", valor: 120, descricao: "Curso online", categoria: "Estudos", data: "2026-09-04", metodo: "Cartão de crédito", observacao: null, attachment_url: null, is_recurring: false, recurrence_interval: null, recurrence_end_date: null, parent_id: null, created_at: now },
  { id: "t8", user_id: uid, tipo: "entrada", valor: 350, descricao: "Venda de item usado", categoria: "Outros", data: "2026-09-02", metodo: "Pix", observacao: null, attachment_url: null, is_recurring: false, recurrence_interval: null, recurrence_end_date: null, parent_id: null, created_at: now },
];

export const MOCK_GOALS: Goal[] = [
  { id: "g1", user_id: uid, nome: "PC", valor_meta: 1500, valor_guardado: 1170, created_at: now },
  { id: "g2", user_id: uid, nome: "Viagem", valor_meta: 2200, valor_guardado: 540, created_at: now },
  { id: "g3", user_id: uid, nome: "Reserva", valor_meta: 3000, valor_guardado: 900, created_at: now },
];

export const MOCK_BUDGET: BudgetLimit[] = [
  { id: "b1", user_id: uid, categoria: "Alimentação", limite: 250, mes_referencia: "2026-09" },
  { id: "b2", user_id: uid, categoria: "Transporte", limite: 150, mes_referencia: "2026-09" },
  { id: "b3", user_id: uid, categoria: "Tecnologia", limite: 100, mes_referencia: "2026-09" },
  { id: "b4", user_id: uid, categoria: "Lazer", limite: 120, mes_referencia: "2026-09" },
  { id: "b5", user_id: uid, categoria: "Estudos", limite: 150, mes_referencia: "2026-09" },
];

export const MOCK_CATEGORIES: Category[] = [
  "Alimentação", "Transporte", "Tecnologia", "Estudos", "Lazer",
  "Casa", "Compras", "Freelance", "Salário", "Metas", "Outros",
].map((nome, i) => ({ id: `c${i}`, user_id: uid, nome, icone: null, created_at: now }));

export const EVOLUCAO_SALDO_MOCK = [
  { mes: "Abr", saldo: 320 },
  { mes: "Mai", saldo: 510 },
  { mes: "Jun", saldo: 410 },
  { mes: "Jul", saldo: 680 },
  { mes: "Ago", saldo: 590 },
  { mes: "Set", saldo: 847.5 },
];
