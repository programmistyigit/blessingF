import React from "react";
import { cn } from "@/lib/utils";
import { 
  Wheat,
  Pill,
  Users,
  Wrench,
  Router,
  Truck,
  Building,
  CircleDollarSign,
  Lightbulb
} from "lucide-react";

export type ExpenseCategory = 
  | "feed" 
  | "medicine" 
  | "labor" 
  | "maintenance" 
  | "utilities" 
  | "transport"
  | "infrastructure"
  | "equipment"
  | "electricity"
  | "other";

// Uzbek names for categories
export const getCategoryName = (category: ExpenseCategory): string => {
  const categoryNames: Record<ExpenseCategory, string> = {
    feed: "Yem xarajatlari",
    medicine: "Dori-darmon xarajatlari",
    labor: "Ish haqi xarajatlari",
    maintenance: "Ta'mirlash xarajatlari",
    utilities: "Kommunal xarajatlar",
    transport: "Transport xarajatlari",
    infrastructure: "Infratuzilma xarajatlari",
    equipment: "Jihozlar xarajatlari",
    electricity: "Elektr energiyasi xarajatlari",
    other: "Boshqa xarajatlar"
  };
  
  return categoryNames[category] || categoryNames.other;
};

// Get category color
export const getCategoryColor = (category: ExpenseCategory): string => {
  const categoryColors: Record<ExpenseCategory, string> = {
    feed: "text-orange-500",
    medicine: "text-blue-500",
    labor: "text-violet-500",
    maintenance: "text-yellow-600",
    utilities: "text-slate-600",
    transport: "text-emerald-500",
    infrastructure: "text-teal-600",
    equipment: "text-purple-500",
    electricity: "text-amber-500",
    other: "text-gray-500"
  };
  
  return categoryColors[category] || categoryColors.other;
};

interface ExpenseCategoryIconProps {
  category: ExpenseCategory;
  size?: number;
  className?: string;
}

// Kategoriya ikonalari va ranglari
const CATEGORY_ICONS = {
  feed: { icon: Wheat, color: "text-orange-500" },
  medicine: { icon: Pill, color: "text-blue-500" },
  labor: { icon: Users, color: "text-violet-500" },
  maintenance: { icon: Wrench, color: "text-yellow-600" },
  utilities: { icon: Building, color: "text-slate-600" },
  transport: { icon: Truck, color: "text-emerald-500" },
  infrastructure: { icon: Building, color: "text-teal-600" },
  equipment: { icon: Router, color: "text-purple-500" },
  electricity: { icon: Lightbulb, color: "text-amber-500" },
  other: { icon: CircleDollarSign, color: "text-gray-500" },
};

const ExpenseCategoryIcon: React.FC<ExpenseCategoryIconProps> = ({
  category,
  size = 20,
  className,
}) => {
  const categoryInfo = CATEGORY_ICONS[category] || CATEGORY_ICONS.other;
  const IconComponent = categoryInfo.icon;

  return (
    <IconComponent 
      size={size} 
      className={cn(categoryInfo.color, className)} 
    />
  );
};

export default ExpenseCategoryIcon;