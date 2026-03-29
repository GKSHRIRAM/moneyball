"use client";

import { useAuthStore } from "@/store/authStore";
import { useProducts } from "@/hooks/useProducts";
import { formatPrice } from "@/lib/utils";
import { RiskBadge } from "@/components/retailer/RiskBadge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import {
  Package,
  AlertTriangle,
  Calendar,
  Tag,
  ArrowRight,
  Plus,
  LayoutDashboard,
  Clock,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/Spinner";

export default function RetailerDashboardPage() {
  const { user } = useAuthStore();
  
  // Fetch all products (with large page size to calculate stats)
  const { data: allProducts, isLoading } = useProducts({ page_size: 100 });
  
  // Fetch specifically "at-risk" products for the action list
  const { data: atRiskProducts } = useProducts({ 
    page_size: 5, 
    risk_filter: "at_risk" 
  });

  const products = allProducts?.items || [];
  const totalProducts = allProducts?.total || 0;
  
  // Calculate stats
  const expiringThisWeek = products.filter(p => p.days_to_expiry <= 7).length;
  const atRiskCount = products.filter(p => p.risk_score >= 50).length;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Spinner size="lg" className="text-primary mb-4" />
        <p className="text-gray-500 font-medium">Loading your dashboard...</p>
      </div>
    );
  }

  // Empty State if no products exist
  if (totalProducts === 0) {
    return (
      <div className="p-6 lg:p-8 animate-fade-in">
        <div className="mb-8">
           <h1 className="text-3xl sm:text-4xl font-black text-charcoal tracking-tight">
            Welcome, {user?.name?.split(" ")[0] || "Retailer"} 👋
          </h1>
          <p className="mt-1 text-gray-500">Let's get your inventory set up to start recovering revenue.</p>
        </div>
        
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-20 h-20 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
            <Package className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-black text-charcoal mb-3">Your Inventory is Empty</h2>
          <p className="text-gray-500 max-w-md mx-auto mb-8">
            Add your products manually or via CSV upload to let DealDrop begin tracking shelf-life risk.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
             <Link href="/products/add">
               <Button size="lg" className="px-10">
                 <Plus className="mr-2" /> 
                 Add First Product
               </Button>
             </Link>
             <Link href="/products">
               <Button variant="secondary" size="lg">
                 Learn about Bulk Upload
               </Button>
             </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="mb-8 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-charcoal tracking-tight">
            Good morning, {user?.name?.split(" ")[0] || "Retailer"}
          </h1>
          <p className="mt-1 text-gray-500 font-medium flex items-center gap-2">
            <LayoutDashboard size={14} className="text-primary" />
            Your store is currently tracking{" "}
            <span className="text-charcoal font-bold">{totalProducts} products</span>.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch gap-3 shrink-0">
          <Link
            href="/strategy"
            className="group flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm hover:border-primary/30 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-mint flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <SlidersHorizontal className="w-5 h-5 text-olive group-hover:text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-charcoal">
                Onboarding &amp; strategy
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Configure pricing rules, pickup, and safeguards
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-gray-100 text-sm font-bold text-gray-400 self-start sm:self-center">
            <Clock size={16} className="text-primary" />
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              day: "numeric",
              month: "short",
            })}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { 
            label: "Total Products", 
            value: totalProducts, 
            icon: Package, 
            color: "text-blue-500", 
            bg: "bg-blue-50" 
          },
          { 
            label: "Expiring Soon", 
            value: expiringThisWeek, 
            icon: Calendar, 
            color: "text-amber-500", 
            bg: "bg-amber-50" 
          },
          { 
            label: "At Risk items", 
            value: atRiskCount, 
            icon: AlertTriangle, 
            color: "text-red-500", 
            bg: "bg-red-50" 
          },
          { 
            label: "Active Deals", 
            value: 0, 
            icon: Tag, 
            color: "text-emerald-500", 
            bg: "bg-emerald-50",
            subtitle: "Phase 5"
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={cn("p-3 rounded-xl transition-colors", stat.bg)}>
                <stat.icon size={20} className={stat.color} />
              </div>
              {stat.subtitle && (
                <span className="text-[10px] uppercase font-black tracking-widest text-gray-300">
                  {stat.subtitle}
                </span>
              )}
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
              {stat.label}
            </p>
            <p className="text-3xl font-black text-charcoal">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Products Needing Action */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-charcoal flex items-center gap-3">
              Products Needing Action
              <span className="p-1 px-2.5 bg-red-100 text-red-600 text-[10px] font-black rounded-full">
                PRIORITY
              </span>
            </h2>
            <Link 
              href="/products?risk_filter=at_risk" 
              className="text-sm font-bold text-primary flex items-center gap-1 hover:gap-2 transition-all"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left min-w-[500px]">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Product</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Days Left</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Risk Level</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {atRiskProducts?.items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <p className="text-sm text-gray-400 font-medium italic">No immediate actions required. Great job!</p>
                    </td>
                  </tr>
                ) : (
                  atRiskProducts?.items.map((product) => (
                    <tr key={product.id} className="group hover:bg-gray-50 transition-all">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-charcoal">{product.name}</span>
                          <span className="text-[10px] font-medium text-gray-400">MRP: {formatPrice(product.mrp)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         <span className={cn(
                           "text-sm font-black",
                           product.days_to_expiry <= 3 ? "text-red-500" : "text-amber-500"
                         )}>
                           {product.days_to_expiry} days
                         </span>
                      </td>
                      <td className="px-6 py-4">
                        <RiskBadge risk_label={product.risk_label} showScore={false} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          disabled 
                          title="Deal creation available in Phase 5"
                        >
                          Price Drop
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar Mini-insights */}
        <div className="space-y-6">
           <div className="p-6 bg-primary rounded-2xl text-white shadow-xl shadow-primary/10 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
              <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                <Tag size={16} className="text-white/60" />
                Quick Tip
              </h3>
              <p className="text-sm font-medium leading-relaxed opacity-90">
                Products marked as <span className="font-black underline underline-offset-4 decoration-white/20">Critical</span> risk generally sell 80% faster when discounted by 35% or more.
              </p>
           </div>
           
           <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
             <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Stock Overview</h3>
             <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Inventory Health</span>
                  <span className="text-sm font-black text-charcoal">
                    {atRiskCount > 5 ? "Action Required" : "Stable"}
                  </span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                   <div 
                     className={cn(
                       "h-full transition-all duration-1000",
                       atRiskCount === 0 ? "bg-emerald-500 w-[100%]" : 
                       atRiskCount < 5 ? "bg-amber-400 w-[70%]" : "bg-red-500 w-[30%]"
                     )}
                   />
                </div>
                <p className="text-[10px] text-gray-400 font-medium">
                  Inventory risk score is calculated relative to total stock volume and nearest expiry dates.
                </p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
