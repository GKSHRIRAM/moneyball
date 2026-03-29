import { Badge } from "@/components/ui/Badge";
import { RiskLabel } from "@/types/product";

interface RiskBadgeProps {
  risk_score?: number;
  risk_label?: RiskLabel;
  showScore?: boolean;
}

const RISK_MAP: Record<string, { variant: RiskLabel; text: string }> = {
  safe: { variant: "safe", text: "Low Risk" },
  watch: { variant: "watch", text: "Watch" },
  urgent: { variant: "urgent", text: "Urgent" },
  critical: { variant: "critical", text: "Critical" },
};

function scoreToLabel(score: number): RiskLabel {
  if (score <= 30) return "safe";
  if (score <= 60) return "watch";
  if (score <= 85) return "urgent";
  return "critical";
}

export function RiskBadge({
  risk_score = 0,
  risk_label,
  showScore = true,
}: RiskBadgeProps) {
  const label = risk_label || scoreToLabel(risk_score);
  const config = RISK_MAP[label];

  return (
    <div className="flex items-center gap-1.5">
      <Badge variant={config.variant} label={config.text} size="sm" />
      {showScore && (
        <span className="text-[10px] font-medium text-gray-400">
          {risk_score}
        </span>
      )}
    </div>
  );
}

export default RiskBadge;
