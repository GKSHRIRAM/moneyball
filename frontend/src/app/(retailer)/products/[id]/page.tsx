"use client";

import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, Edit3, Trash2, AlertTriangle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { ProductForm } from "@/components/retailer/ProductForm";
import { useProduct, useUpdateProduct, useDeleteProduct, useProductRisk } from "@/hooks/useProducts";
import { useToast } from "@/components/ui/Toast";
import { ProductUpdateRequest } from "@/types/product";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const toast = useToast();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const { data: product, isLoading: isProductLoading, isError } = useProduct(id);
  const { data: risk } = useProductRisk(id);
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const handleSubmit = async (data: any) => {
    try {
      await updateProduct.mutateAsync({ id, data: data as ProductUpdateRequest });
      toast.success("Changes saved! ✨");
      router.push("/products");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to update product");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProduct.mutateAsync(id);
      toast.success("Product deleted successfully");
      router.push("/products");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to delete product");
    }
  };

  if (isProductLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Spinner size="lg" className="text-primary mb-4" />
        <p className="text-gray-500 font-medium">Fetching details...</p>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-gray-100 shadow-sm max-w-lg mx-auto mt-20">
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-charcoal mb-2">Product Not Found</h2>
        <p className="text-gray-500 mb-6">We couldn't find the product you're looking for. It might have been deleted.</p>
        <Link href="/products" className="text-primary font-bold hover:underline">
          Return to Inventory
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto pb-32 animate-fade-in relative">
      {/* Back link */}
      <div className="mb-6">
        <Link 
          href="/products" 
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-primary transition-all group"
        >
          <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center group-hover:border-primary/20 group-hover:bg-orange-50 transition-all">
            <ChevronLeft size={16} />
          </div>
          Back to Inventory
        </Link>
      </div>

      {/* Header with Risk Context */}
      <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center animate-pulse-slow">
            <Edit3 className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-charcoal leading-none truncate max-w-[280px]">
              {product.name}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">
                ID: {product.id.slice(0, 8)}...
              </span>
              <Badge 
                label={product.risk_label.toUpperCase()} 
                variant={product.risk_label} 
                className="text-[10px] py-0 px-2 font-black"
                size="sm"
              />
            </div>
          </div>
        </div>

        {risk && (
          <div className="flex items-center gap-4 pl-4 sm:border-l border-gray-100">
            <div className="text-right">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Current Risk</p>
              <p className={cn(
                "text-2xl font-black leading-none mt-1",
                risk.risk_score >= 60 ? "text-red-500" : "text-emerald-500"
              )}>
                {risk.risk_score}%
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main form (Col 1 & 2) */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <h3 className="text-lg font-black text-charcoal mb-6 flex items-center gap-2">
              General Information
              <span className="h-1 w-1 rounded-full bg-primary" />
            </h3>
            <ProductForm 
              mode="edit" 
              initialData={product} 
              onSubmit={handleSubmit} 
              isLoading={updateProduct.isPending} 
            />
          </div>

          {/* Delete Danger Zone */}
          <div className="bg-red-50/50 rounded-2xl border border-red-100 p-8">
            <h3 className="text-lg font-black text-red-600 mb-2">Danger Zone</h3>
            <p className="text-sm text-red-600/70 mb-6 font-medium">
              Deleting this product will remove it across the platform. You cannot undo this action.
            </p>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-6 h-11 bg-white border border-red-200 text-red-500 font-bold rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm flex items-center gap-2"
            >
              <Trash2 size={16} />
              Delete Product
            </button>
          </div>
        </div>

        {/* Sidebar Info/Risk (Col 3) */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden relative">
             <div className="absolute top-0 right-0 p-2 opacity-5">
              <Package size={80} />
             </div>
             <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Inventory Context</h4>
             <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-xs font-medium text-gray-500">Days to Expiry</span>
                  <span className={cn(
                    "text-sm font-black",
                    product.days_to_expiry <= 3 ? "text-red-500" : "text-emerald-500"
                  )}>{product.days_to_expiry} days</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-xs font-medium text-gray-500">Active Stock</span>
                  <span className="text-sm font-black text-charcoal">{product.quantity} units</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-xs font-medium text-gray-500">Created On</span>
                  <span className="text-sm font-medium text-gray-400 capitalize">
                    {new Date(product.created_at).toLocaleDateString()}
                  </span>
                </div>
             </div>
          </div>
          
          <div className="p-6 bg-charcoal rounded-2xl text-white shadow-lg overflow-hidden relative group">
            <div className="absolute inset-0 bg-primary opacity-5 group-hover:opacity-10 transition-opacity duration-500" />
            <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
            <h4 className="text-xs font-black text-white/40 uppercase tracking-widest mb-3">Live Risk Insight</h4>
            <p className="text-sm leading-relaxed text-white/90">
              This product is labeled as <span className="font-bold text-primary">{product.risk_label}</span>. 
              {product.risk_label === "urgent" || product.risk_label === "critical" 
                ? " We recommend listing a flash deal immediately to recover cost."
                : " Monitoring shelf-life stability."}
            </p>
          </div>
        </div>
      </div>

      {/* Reusable Delete Confirmation (Can also move to component but keeping here for scope) */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsDeleteModalOpen(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-2xl font-black text-charcoal mb-3">Delete Permanent?</h3>
            <p className="text-gray-500 mb-8 leading-relaxed">
              This will remove <span className="font-bold text-charcoal">"{product.name}"</span> from your dashboard and any active search results. 
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleDelete}
                className="w-full h-14 bg-red-500 text-white font-black rounded-2xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
              >
                Yes, Delete Product
              </button>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="w-full h-14 bg-gray-50 text-gray-500 font-bold rounded-2xl hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Package({ size }: { size: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M7.5 4.21 12 2l4.5 2.21" />
      <path d="m7.5 4.21 4.5 2.21 4.5-2.21" />
      <path d="m7.5 4.21-4.5 2.21v9.08l4.5 2.21" />
      <path d="m16.5 4.21 4.5 2.21v9.08l-4.5 2.21" />
      <path d="M12 22V11" />
      <path d="M12 11.5v-.5" />
      <path d="M4.5 15.5v2.5" />
      <path d="M19.5 15.5v2.5" />
      <path d="m3 6.42 9 4.42 9-4.42" />
    </svg>
  );
}
