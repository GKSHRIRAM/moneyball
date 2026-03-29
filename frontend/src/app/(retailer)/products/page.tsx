"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Upload, Filter, X, ChevronRight, Package, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProductTable } from "@/components/retailer/ProductTable";
import { CSVUploader } from "@/components/retailer/CSVUploader";
import { useProducts, useDeleteProduct } from "@/hooks/useProducts";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<string>("");
  const [expiryFilter, setExpiryFilter] = useState<string>("");
  const [riskFilter, setRiskFilter] = useState<string>("");
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);

  const toast = useToast();
  const deleteProduct = useDeleteProduct();

  const { data, isLoading, refetch } = useProducts({
    page,
    page_size: 10,
    category: category || undefined,
    expiry_filter: expiryFilter || undefined,
    risk_filter: riskFilter || undefined,
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct.mutateAsync(id);
      toast.success("Product deleted successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to delete product");
    }
  };

  const clearFilters = () => {
    setCategory("");
    setExpiryFilter("");
    setRiskFilter("");
    setPage(1);
  };

  const isFilterActive = category || expiryFilter || riskFilter;

  return (
    <div className="p-6 lg:p-8 animate-fade-in relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-black text-charcoal tracking-tight">Products</h1>
            {data && data.total > 0 && (
              <span className="px-2.5 py-1 bg-surface font-bold text-gray-400 text-xs rounded-full border border-gray-100">
                {data.total}
              </span>
            )}
          </div>
          <p className="text-gray-500">Manage your inventory and track shelf-life risk.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="secondary" 
            onClick={() => setIsUploaderOpen(true)}
            className="hidden sm:inline-flex"
          >
            <Upload size={18} className="mr-2" />
            Bulk Upload
          </Button>
          <Link href="/products/add">
            <Button>
              <Plus size={18} className="mr-2" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Category Filter */}
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="h-10 px-3 py-1.5 bg-white border border-gray-100 rounded-lg text-sm font-medium text-charcoal focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
          >
            <option value="">All Categories</option>
            <option value="bakery">Bakery</option>
            <option value="grocery">Grocery</option>
            <option value="fmcg">FMCG</option>
          </select>

          {/* Expiry Filter */}
          <select
            value={expiryFilter}
            onChange={(e) => { setExpiryFilter(e.target.value); setPage(1); }}
            className="h-10 px-3 py-1.5 bg-white border border-gray-100 rounded-lg text-sm font-medium text-charcoal focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
          >
            <option value="">All Expiry</option>
            <option value="expiring_soon">Expiring in 7 days</option>
            <option value="expired">Already Expired</option>
          </select>

          {/* Risk Filter */}
          <select
            value={riskFilter}
            onChange={(e) => { setRiskFilter(e.target.value); setPage(1); }}
            className="h-10 px-3 py-1.5 bg-white border border-gray-100 rounded-lg text-sm font-medium text-charcoal focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
          >
            <option value="">All Risk</option>
            <option value="at_risk">At Risk Only</option>
          </select>

          {isFilterActive && (
            <button
              onClick={clearFilters}
              className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1.5 px-3 py-2 bg-orange-50 rounded-lg transition-colors border border-orange-100"
            >
              <X size={14} />
              Clear Filters
            </button>
          )}
        </div>
        
        <div className="text-xs text-gray-400 font-medium">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Product Table */}
      <ProductTable
        products={data?.items || []}
        total={data?.total || 0}
        page={page}
        pageSize={10}
        onPageChange={setPage}
        onDelete={handleDelete}
        isLoading={isLoading}
      />

      {/* CSV Uploader Slide-over */}
      {isUploaderOpen && (
        <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => setIsUploaderOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white shadow-2xl animate-in slide-in-from-right duration-500 overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-charcoal leading-none">Bulk Upload</h2>
                  <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-bold">Import CSV Data</p>
                </div>
              </div>
              <button 
                onClick={() => setIsUploaderOpen(false)}
                className="p-2 text-gray-400 hover:text-charcoal hover:bg-white rounded-lg transition-all border border-transparent hover:border-gray-100"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Add products to your inventory quickly by uploading a CSV file. Each row should 
                represent a unique product.
              </p>
              
              <div className="space-y-6">
                <CSVUploader onSuccess={() => {
                  refetch();
                  // Don't close immediately so user sees success state
                }} />
                
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Package size={14} className="text-gray-300" />
                    Instructions
                  </h4>
                  <ul className="space-y-2.5">
                    {[
                      "Use YYYY-MM-DD for expiry dates.",
                      "Ensure categories match exactly (bakery, grocery, fmcg).",
                      "Keep filenames clean and size under 5MB.",
                      "Max 200 products per upload."
                    ].map((step, i) => (
                      <li key={i} className="flex gap-2.5 text-xs text-gray-500">
                        <span className="text-primary font-black">{i + 1}.</span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
