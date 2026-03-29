import { useState } from "react";
import { DealSuggestion, DealType } from "@/types/deal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { RiskBadge } from "@/components/retailer/RiskBadge";
import { useCreateDeal } from "@/hooks/useDeals";
import { useToast } from "@/components/ui/Toast";
import { formatPrice, cn } from "@/lib/utils";
import { Check, Edit2, AlertCircle } from "lucide-react";

export function DealSuggestionCard({ suggestion }: { suggestion: DealSuggestion }) {
  const [isEditing, setIsEditing] = useState(false);
  const [customPrice, setCustomPrice] = useState(suggestion.suggested_deal_price.toString());
  const [isListed, setIsListed] = useState(false);
  
  const createDeal = useCreateDeal();
  const toast = useToast();

  const handleListDeal = async () => {
    try {
      if (parseFloat(customPrice) <= 0 || parseFloat(customPrice) > suggestion.mrp) {
        toast.error("Invalid deal price");
        return;
      }
      await createDeal.mutateAsync({
        product_id: suggestion.product_id,
        deal_price: parseFloat(customPrice),
        quantity_to_list: suggestion.quantity,
        deal_type: DealType.clearance,
      });
      setIsListed(true);
      toast.success("Deal listed successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to list deal");
    }
  };

  if (isListed) {
    return (
      <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-100 flex items-center justify-between animate-fade-in shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
            <Check className="text-emerald-600" size={24} />
          </div>
          <div>
            <h4 className="font-bold text-emerald-900 line-through opacity-70">{suggestion.product_name}</h4>
            <p className="text-sm font-medium text-emerald-700 mt-1">✓ Deal Listed Successfully</p>
          </div>
        </div>
      </div>
    );
  }

  const currentDiscountPct = Math.round((1 - parseFloat(customPrice) / suggestion.mrp) * 100);

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-6 md:items-center justify-between">
      {/* Left: Product Info */}
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <h4 className="font-black text-charcoal text-lg">{suggestion.product_name}</h4>
          <Badge label={suggestion.category.toUpperCase()} size="sm" />
          <span className={cn(
            "text-xs font-bold uppercase tracking-wider",
            suggestion.days_to_expiry <= 3 ? "text-red-500" : "text-amber-500"
          )}>
            {suggestion.days_to_expiry} days left
          </span>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <RiskBadge risk_label={suggestion.risk_label} risk_score={suggestion.risk_score} showScore />
          <span className="text-xs text-gray-400 font-medium">| {suggestion.quantity} units available</span>
        </div>
      </div>

      {/* Center: Pricing */}
      <div className="flex flex-col items-start md:items-center">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-500">₹</span>
            <input
              type="number"
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
              className="w-24 border border-primary px-3 py-1.5 rounded-lg text-lg font-black text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              autoFocus
              onBlur={() => setIsEditing(false)}
              onKeyDown={(e) => e.key === "Enter" && setIsEditing(false)}
            />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-gray-400 line-through">
              {formatPrice(suggestion.mrp)}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-primary">
                {formatPrice(parseFloat(customPrice))}
              </span>
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded-md">
                -{currentDiscountPct}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex flex-col gap-2 shrink-0 md:w-48">
        <Button 
          onClick={handleListDeal} 
          isLoading={createDeal.isPending}
        >
          List This Deal
        </Button>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="text-xs font-bold text-gray-400 hover:text-primary transition-colors flex items-center justify-center gap-1.5 py-2"
        >
          <Edit2 size={12} />
          {isEditing ? "Save Price" : "Adjust Price"}
        </button>
      </div>
    </div>
  );
}
