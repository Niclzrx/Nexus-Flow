import type { Transaction } from "@/types";

function addInterval(dateStr: string, interval: NonNullable<Transaction["recurrence_interval"]>): string {
  const d = new Date(dateStr);
  if (interval === "weekly") d.setDate(d.getDate() + 7);
  else if (interval === "monthly") d.setMonth(d.getMonth() + 1);
  else if (interval === "yearly") d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

/** Retorna as datas faltantes para um recorrente até hoje (exclusivo do parent) */
export function missingOccurrences(
  parent: Transaction,
  all: Transaction[],
  today: string
): string[] {
  if (!parent.is_recurring || !parent.recurrence_interval) return [];
  const family = all.filter((t) => t.parent_id === parent.id || t.id === parent.id);
  let maxDate = parent.data;
  for (const t of family) if (t.data > maxDate) maxDate = t.data;
  const out: string[] = [];
  let next = addInterval(maxDate, parent.recurrence_interval);
  let guard = 0;
  while (next <= today && guard < 24) {
    if (parent.recurrence_end_date && next > parent.recurrence_end_date) break;
    // não cria se já existe na família
    if (!family.some((t) => t.data === next)) out.push(next);
    next = addInterval(next, parent.recurrence_interval);
    guard++;
  }
  return out;
}
