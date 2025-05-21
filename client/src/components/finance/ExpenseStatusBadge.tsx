import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ExpenseApprovalStatus = "pending" | "approved" | "rejected";
export type ExpensePaymentStatus = "pending" | "paid" | "partially_paid" | "cancelled";

type StatusVariant = "default" | "secondary" | "destructive" | "outline";

// Define exact return type of status info to avoid TypeScript errors
type StatusInfo = {
  label: string;
  variant: StatusVariant;
};

// Status and display information maps
const STATUS_INFO: {
  approval: Record<ExpenseApprovalStatus, StatusInfo>;
  payment: Record<ExpensePaymentStatus, StatusInfo>;
} = {
  approval: {
    pending: { label: "Kutilmoqda", variant: "outline" },
    approved: { label: "Tasdiqlangan", variant: "default" },
    rejected: { label: "Rad etilgan", variant: "destructive" },
  },
  payment: {
    pending: { label: "To'lanmagan", variant: "outline" },
    paid: { label: "To'langan", variant: "default" },
    partially_paid: { label: "Qisman to'langan", variant: "secondary" },
    cancelled: { label: "Bekor qilingan", variant: "destructive" },
  }
};

interface ExpenseStatusBadgeProps {
  status: ExpenseApprovalStatus | ExpensePaymentStatus;
  type: "approval" | "payment";
  className?: string;
}

const ExpenseStatusBadge: React.FC<ExpenseStatusBadgeProps> = ({ 
  status, 
  type, 
  className = "" 
}) => {
  // Default values
  let statusInfo: StatusInfo = { label: status, variant: "default" };
  
  // Get status info based on type and status
  if (type === "approval" && status in STATUS_INFO.approval) {
    statusInfo = STATUS_INFO.approval[status as ExpenseApprovalStatus];
  } else if (type === "payment" && status in STATUS_INFO.payment) {
    statusInfo = STATUS_INFO.payment[status as ExpensePaymentStatus];
  }

  return (
    <Badge 
      variant={statusInfo.variant} 
      className={cn(className)}
    >
      {statusInfo.label}
    </Badge>
  );
};

export default ExpenseStatusBadge;