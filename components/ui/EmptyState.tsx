import { Receipt } from "lucide-react";

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
      <Receipt className="h-8 w-8 mb-2 text-text-faint" />
      <span className="font-display text-sm font-medium text-text-muted">{text}</span>
    </div>
  );
}
