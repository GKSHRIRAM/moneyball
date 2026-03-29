import { cn } from "@/lib/utils";

type BadgeVariant = "safe" | "watch" | "urgent" | "critical" | "default";

interface BadgeProps {
  variant?: BadgeVariant;
  size?: "sm" | "md";
  label: string;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  safe: "bg-emerald-50 text-emerald-700 border-emerald-200",
  watch: "bg-amber-50 text-amber-700 border-amber-200",
  urgent: "bg-orange-50 text-orange-700 border-orange-200",
  critical: "bg-red-50 text-red-700 border-red-200",
  default: "bg-gray-50 text-gray-600 border-gray-200",
};

export function Badge({
  variant = "default",
  size = "md",
  label,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium border rounded-full whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        variantStyles[variant],
        className
      )}
    >
      {label}
    </span>
  );
}

export default Badge;
