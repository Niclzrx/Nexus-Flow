export const fmt = (n: number): string =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const fmtDate = (iso: string): string => {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
};

export const fmtDateLong = (iso: string): string => {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
};

export const todayISO = (): string => new Date().toISOString().slice(0, 10);
export const currentMonthRef = (): string => new Date().toISOString().slice(0, 7);

// --- Relatorios: filtro por periodo ---

export type ReportPeriod = "semanal" | "mensal" | "anual";

function getPeriodStart(periodo: ReportPeriod, ref: Date = new Date()): string {
  const d = new Date(ref);
  if (periodo === "semanal") {
    const day = d.getDay();
    const diff = day === 0 ? 6 : day - 1;
    d.setDate(d.getDate() - diff);
  } else if (periodo === "mensal") {
    d.setDate(1);
  } else {
    d.setMonth(0, 1);
  }
  return d.toISOString().slice(0, 10);
}

function getPeriodEnd(periodo: ReportPeriod, ref: Date = new Date()): string {
  const d = new Date(ref);
  if (periodo === "semanal") {
    const day = d.getDay();
    const diff = day === 0 ? 0 : 7 - day;
    d.setDate(d.getDate() + diff);
  } else if (periodo === "mensal") {
    d.setMonth(d.getMonth() + 1, 0);
  } else {
    d.setMonth(11, 31);
  }
  return d.toISOString().slice(0, 10);
}

export function filterByPeriod<T extends { data: string }>(items: T[], periodo: ReportPeriod, ref: Date = new Date()): T[] {
  const start = getPeriodStart(periodo, ref);
  const end = getPeriodEnd(periodo, ref);
  return items.filter((t) => t.data >= start && t.data <= end);
}

export function filterByPreviousPeriod<T extends { data: string }>(items: T[], periodo: ReportPeriod, ref: Date = new Date()): T[] {
  const prev = new Date(ref);
  if (periodo === "semanal") {
    prev.setDate(prev.getDate() - 7);
  } else if (periodo === "mensal") {
    prev.setMonth(prev.getMonth() - 1);
  } else {
    prev.setFullYear(prev.getFullYear() - 1);
  }
  return filterByPeriod(items, periodo, prev);
}

export function groupByDay<T extends { data: string; valor: number }>(items: T[]): { label: string; valor: number }[] {
  const map: Record<string, number> = {};
  items.forEach((t) => { const key = t.data.slice(5); map[key] = (map[key] ?? 0) + t.valor; });
  return Object.entries(map).sort(([a], [b]) => (a < b ? -1 : 1)).map(([label, valor]) => ({ label, valor }));
}

export function groupByWeek<T extends { data: string; valor: number }>(items: T[]): { label: string; valor: number }[] {
  const map: Record<string, number> = {};
  items.forEach((t) => {
    const d = new Date(t.data + "T00:00:00");
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil(((d.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
    const key = d.getFullYear() + "-S" + week;
    map[key] = (map[key] ?? 0) + t.valor;
  });
  return Object.entries(map).sort(([a], [b]) => (a < b ? -1 : 1)).map(([label, valor]) => ({ label, valor }));
}

export function groupByMonth<T extends { data: string; valor: number }>(items: T[]): { label: string; valor: number }[] {
  const map: Record<string, number> = {};
  items.forEach((t) => { const key = t.data.slice(0, 7); map[key] = (map[key] ?? 0) + t.valor; });
  return Object.entries(map).sort(([a], [b]) => (a < b ? -1 : 1)).map(([label, valor]) => ({ label, valor }));
}