import React, { ReactNode } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconBgColor: string;
  borderColor: string;
  change?: {
    value: string | number;
    isIncrease: boolean;
  };
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  iconBgColor,
  borderColor,
  change,
  className
}) => {
  return (
    <div className={cn(
      "bg-white rounded-lg shadow p-5 border-l-4",
      borderColor,
      className
    )}>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-neutral-600 text-sm font-medium">{title}</p>
          <h2 className="text-3xl font-bold text-neutral-800">{value}</h2>
        </div>
        <div className={cn(
          "p-3 rounded-full",
          iconBgColor
        )}>
          {icon}
        </div>
      </div>
      
      {change && (
        <div className="mt-2">
          <span className={cn(
            "flex items-center text-sm",
            change.isIncrease ? "text-success" : "text-danger"
          )}>
            {change.isIncrease ? (
              <ArrowUpRight className="h-4 w-4 mr-1" />
            ) : (
              <ArrowDownRight className="h-4 w-4 mr-1" />
            )}
            {change.value}
          </span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
