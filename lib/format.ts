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
