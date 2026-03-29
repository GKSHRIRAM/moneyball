import { Deal, DealStatus } from "@/types/deal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useApproveDeal, useCloseDeal } from "@/hooks/useDeals";
import { useToast } from "@/components/ui/Toast";
import { formatPrice, cn } from "@/lib/utils";
import { AlertTriangle, Clock, CheckCircle } from "lucide-react";

export function DealListingCard({ deal }: { deal: Deal }) {
  const approveDeal = useApproveDeal();
  const closeDeal = useCloseDeal();
  const toast = useToast();

  const handleApprove = async () => {
    try {
      await approveDeal.mutateAsync(deal.id);
      toast.success("Deal approved and is now live!");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to approve deal");
    }
  };

  const handleClose = async () => {
    try {
      await closeDeal.mutateAsync(deal.id);
      toast.success(deal.status === DealStatus.draft ? "Draft discarded" : "Deal closed successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to close deal");
    }
  };

  const statusConfig = {
    [DealStatus.draft]: { color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: Clock },
    [DealStatus.active]: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle },
    [DealStatus.reserved]: { color: "bg-blue-50 text-blue-700 border-blue-200", icon: Clock },
    [DealStatus.expired]: { color: "bg-gray-50 text-gray-600 border-gray-200", icon: Clock },
    [DealStatus.cancelled]: { color: "bg-red-50 text-red-700 border-red-200", icon: AlertTriangle },
  };

  const StatusIcon = statusConfig[deal.status]?.icon || Clock;

  return (
    <div className={cn(
      "bg-white rounded-xl p-5 border shadow-sm transition-all flex flex-col justify-between gap-4",
      deal.status === DealStatus.expired ? "border-gray-100 opacity-60" : "border-gray-100 hover:shadow-md"
    )}>
      {/* Top details */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="font-bold text-charcoal text-base truncate pr-2" title={deal.product_name || "Product"}>
            {deal.product_name || "Product"}
          </h4>
          <p className="text-xs text-gray-400 font-medium truncate mt-0.5">{deal.store_name || "Your Store"}</p>
        </div>
        <span className={cn(
          "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
          statusConfig[deal.status]?.color || "bg-gray-50"
        )}>
          <StatusIcon size={12} />
          {deal.status}
        </span>
      </div>

      {/* Center: Pricing & Badges */}
      <div className="flex flex-col gap-3 py-3 border-y border-gray-50 border-dashed my-1">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-400 line-through">
            {formatPrice(deal.original_price)}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-primary">
              {formatPrice(deal.deal_price)}
            </span>
            <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded-md">
              -{deal.discount_pct}%
            </span>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge label={`${deal.quantity_available} left`} variant="default" size="sm" className="bg-gray-50 border-gray-200 text-charcoal" />
          <span className="text-gray-300">|</span>
          <span className={cn(
            "font-bold uppercase tracking-wider",
            deal.is_urgent ? "text-red-500" : "text-gray-500"
          )}>
            {deal.days_to_expiry} days to expiry
          </span>
          {deal.is_urgent && (
            <Badge label="URGENT" variant="critical" size="sm" className="ml-0" />
          )}
        </div>
      </div>

      {/* Bottom: Actions */}
      <div className="flex gap-2">
        {deal.status === DealStatus.draft && (
          <>
            <button
              onClick={handleClose}
              disabled={closeDeal.isPending}
              className="px-4 py-2 border rounded-lg text-xs font-bold text-red-500 border-red-200 hover:bg-red-50 transition-colors w-1/3"
            >
              Discard
            </button>
            <button
              onClick={handleApprove}
              disabled={approveDeal.isPending}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-xs font-bold text-white transition-colors flex-1"
            >
              Approve & List
            </button>
          </>
        )}

        {deal.status === DealStatus.active && (
          <button
            onClick={handleClose}
            disabled={closeDeal.isPending}
            className="w-full px-4 py-2 border rounded-lg text-xs font-bold text-red-500 border-red-200 hover:bg-red-50 transition-colors"
          >
            Close Deal (Cancel)
          </button>
        )}
      </div>
    </div>
  );
}
