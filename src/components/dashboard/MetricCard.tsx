import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "default" | "warning" | "success" | "primary";
  trend?: { value: number; label: string };
}

const variantStyles = {
  default: {
    iconBg: "bg-secondary",
    iconColor: "text-muted-foreground",
  },
  primary: {
    iconBg: "bg-primary-light",
    iconColor: "text-primary",
  },
  warning: {
    iconBg: "bg-warning-light",
    iconColor: "text-warning",
  },
  success: {
    iconBg: "bg-success-light",
    iconColor: "text-success",
  },
};

export function MetricCard({ title, value, subtitle, icon: Icon, variant = "default", trend }: MetricCardProps) {
  const styles = variantStyles[variant];

  return (
    <div className="metric-card border-t-2 border-border bg-card px-4 py-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">{title}</p>
          <p className="font-display text-3xl font-normal text-foreground">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
          {trend && (
            <p className={cn("mt-1 text-xs font-medium", trend.value >= 0 ? "text-success" : "text-destructive")}>
              {trend.value >= 0 ? "+" : ""}{trend.value}% {trend.label}
            </p>
          )}
        </div>
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-sm", styles.iconBg)}>
          <Icon className={cn("h-5 w-5", styles.iconColor)} />
        </div>
      </div>
    </div>
  );
}
