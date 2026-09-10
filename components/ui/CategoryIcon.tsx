import {
  Utensils, Car, Laptop, GraduationCap, Gamepad2,
  Home, ShoppingBag, Briefcase, DollarSign, MoreHorizontal, Target, type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  "Alimentação": Utensils,
  "Transporte": Car,
  "Tecnologia": Laptop,
  "Estudos": GraduationCap,
  "Lazer": Gamepad2,
  "Casa": Home,
  "Compras": ShoppingBag,
  "Freelance": Briefcase,
  "Salário": DollarSign,
  "Metas": Target,
  "Outros": MoreHorizontal,
};

export function CategoryIcon({ categoria, className = "h-4 w-4" }: { categoria: string; className?: string }) {
  const Icon = ICON_MAP[categoria] ?? MoreHorizontal;
  return <Icon className={className} />;
}
