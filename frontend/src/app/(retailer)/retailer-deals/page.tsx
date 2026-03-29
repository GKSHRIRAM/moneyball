"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useDealSuggestions, useRetailerDeals, useRescoreProducts } from "@/hooks/useDeals";
import { DealSuggestionCard } from "@/components/retailer/DealSuggestionCard";
import { DealListingCard } from "@/components/retailer/DealListingCard";
import { useToast } from "@/components/ui/Toast";
import { RefreshCw, Tag, Inbox, Archive, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "suggestions", label: "Suggestions", icon: Tag },
  { id: "draft", label: "Draft", icon: Inbox },
  { id: "active", label: "Active", icon: CheckCircle },
  { id: "expired", label: "Expired", icon: Archive },
];

export default function DealsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get("tab") || "suggestions";

  const { data: suggestions, isLoading: isLoadingSuggestions } = useDealSuggestions();
  const { data: draftDeals, isLoading: isLoadingDraft } = useRetailerDeals("draft");
  const { data: activeDeals, isLoading: isLoadingActive } = useRetailerDeals("active");
  const { data: expiredDeals, isLoading: isLoadingExpired } = useRetailerDeals("expired");

  const rescoreMutation = useRescoreProducts();
  const toast = useToast();

  const handleTabChange = (tabId: string) => {
    router.push(`/retailer-deals?tab=${tabId}`);
  };

  const handleRescore = async () => {
    toast.info("Rescoring in progress...");
    try {
      await rescoreMutation.mutateAsync();
      toast.success("All products rescored successfully.");
    } catch {
      toast.error("Failed to rescore products.");
    }
  };

  return (
    <div className="p-6 lg:p-8 animate-fade-in relative max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-charcoal tracking-tight flex items-center gap-3">
            Deals
            {suggestions && suggestions.length > 0 && (
              <span className="px-2.5 py-1 bg-red-100 text-red-600 font-bold text-xs rounded-full border border-red-200">
                {suggestions.length} waiting
              </span>
            )}
          </h1>
          <p className="text-gray-500 mt-1">Review AI-suggested markdowns and manage your active listings.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="secondary" 
            onClick={handleRescore}
            isLoading={rescoreMutation.isPending}
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} className={cn(rescoreMutation.isPending && "animate-spin")} />
            Rescore All Products
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 mb-8 overflow-x-auto scollbar-hide">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap",
                isActive 
                  ? "border-primary text-primary bg-primary/5" 
                  : "border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              )}
            >
              <tab.icon size={16} />
              {tab.label}
              {tab.id === "suggestions" && suggestions && suggestions.length > 0 && (
                <span className={cn(
                  "ml-1.5 px-2 py-0.5 rounded-full text-[10px]",
                  isActive ? "bg-primary text-white" : "bg-gray-200 text-gray-500"
                )}>
                  {suggestions.length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {/* SUGGESTIONS TAB */}
        {activeTab === "suggestions" && (
          <div className="space-y-6 animate-fade-in">
            <div className="mb-4">
              <h2 className="text-lg font-black text-charcoal">Products ready to list</h2>
              <p className="text-sm text-gray-500">These products have high risk scores and no active deals.</p>
            </div>
            
            {isLoadingSuggestions ? (
               <div className="p-12 text-center text-gray-400 font-medium">Loading suggestions...</div>
            ) : suggestions?.length === 0 ? (
              <div className="bg-emerald-50 rounded-2xl p-12 text-center border border-emerald-100">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-emerald-900 mb-2">All good! No at-risk products right now.</h3>
                <p className="text-sm text-emerald-700">Your inventory is healthy. Check back later.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {suggestions?.map((suggestion) => (
                  <DealSuggestionCard key={suggestion.product_id} suggestion={suggestion} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* DRAFT TAB */}
        {activeTab === "draft" && (
          <div className="space-y-6 animate-fade-in">
            {isLoadingDraft ? (
               <div className="p-12 text-center text-gray-400 font-medium">Loading drafts...</div>
            ) : draftDeals?.items.length === 0 ? (
               <div className="bg-gray-50 rounded-2xl p-12 text-center border border-gray-100">
                 <h3 className="text-lg font-bold text-gray-500 mb-2">No draft deals.</h3>
                 <p className="text-sm text-gray-400">Deals requiring approval will appear here.</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {draftDeals?.items.map((deal) => (
                   <DealListingCard key={deal.id} deal={deal} />
                 ))}
               </div>
            )}
          </div>
        )}

        {/* ACTIVE TAB */}
        {activeTab === "active" && (
          <div className="space-y-6 animate-fade-in">
            {isLoadingActive ? (
               <div className="p-12 text-center text-gray-400 font-medium">Loading active deals...</div>
            ) : activeDeals?.items.length === 0 ? (
               <div className="bg-orange-50 rounded-2xl p-12 text-center border border-orange-100">
                 <h3 className="text-lg font-bold text-charcoal mb-2">No active deals.</h3>
                 <p className="text-sm text-orange-800">Go to Suggestions to create one and start clearing stock.</p>
                 <Button className="mt-6" onClick={() => handleTabChange("suggestions")}>
                    View Suggestions
                 </Button>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {activeDeals?.items.map((deal) => (
                   <DealListingCard key={deal.id} deal={deal} />
                 ))}
               </div>
            )}
          </div>
        )}

        {/* EXPIRED TAB */}
        {activeTab === "expired" && (
          <div className="space-y-6 animate-fade-in">
            {isLoadingExpired ? (
               <div className="p-12 text-center text-gray-400 font-medium">Loading expired deals...</div>
            ) : expiredDeals?.items.length === 0 ? (
               <div className="bg-gray-50 rounded-2xl p-12 text-center border border-gray-100">
                 <h3 className="text-lg font-bold text-gray-500 mb-2">No past deals.</h3>
                 <p className="text-sm text-gray-400">Deals that have expired or ended will be listed here.</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {expiredDeals?.items.map((deal) => (
                   <DealListingCard key={deal.id} deal={deal} />
                 ))}
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
