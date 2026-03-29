"use client";

import { useState } from "react";
import Link from "next/link";
import { Edit2, Trash2, ChevronLeft, ChevronRight, PackageSearch } from "lucide-react";
import { format } from "date-fns";
import { Product } from "@/types/product";
import { formatPrice } from "@/lib/utils";
import { RiskBadge } from "@/components/retailer/RiskBadge";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/Spinner";

interface ProductTableProps {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
}

export function ProductTable({
  products,
  total,
  page,
  pageSize,
  onPageChange,
  onDelete,
  isLoading,
}: ProductTableProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const totalPages = Math.ceil(total / pageSize);
  const startRange = (page - 1) * pageSize + 1;
  const endRange = Math.min(page * pageSize, total);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-12 flex flex-col items-center justify-center">
          <Spinner size="lg" className="text-primary mb-4" />
          <p className="text-sm text-gray-500 font-medium">Loading inventory...</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <PackageSearch className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-bold text-charcoal mb-1">No products found</h3>
        <p className="text-gray-500 max-w-sm mx-auto mb-6">
          Your inventory is empty. Add your first product manually or via CSV upload.
        </p>
        <Link
          href="/products/add"
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
        >
          Add Product
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Product</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Category</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">MRP</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Expiry</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Risk</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {products.map((product) => {
              const isExpiringSoon = product.days_to_expiry <= 3;
              
              return (
                <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-charcoal truncate max-w-[200px]" title={product.name}>
                        {product.name}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">
                        {product.batch_number || "No Batch"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge 
                      label={product.category} 
                      variant="default" 
                      className="capitalize"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-charcoal">
                      {formatPrice(product.mrp)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-sm font-bold",
                      product.quantity <= 10 ? "text-orange-600" : "text-charcoal"
                    )}>
                      {product.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className={cn(
                        "text-sm font-medium",
                        isExpiringSoon ? "text-red-500" : "text-gray-600"
                      )}>
                        {format(new Date(product.expiry_date), "dd MMM yyyy")}
                      </span>
                      <span className={cn(
                        "text-[10px] font-bold uppercase",
                        isExpiringSoon ? "text-red-400" : "text-gray-400"
                      )}>
                        {product.days_to_expiry < 0 ? "Expired" : `${product.days_to_expiry} days left`}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <RiskBadge risk_score={product.risk_score} risk_label={product.risk_label} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/products/${product.id}`}
                        className="p-2 text-gray-400 hover:text-primary hover:bg-orange-50 rounded-lg transition-colors"
                        title="Edit Product"
                      >
                        <Edit2 size={16} />
                      </Link>
                      <button
                        onClick={() => setDeleteConfirm(product.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Product"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-gray-500">
            Showing <span className="font-semibold text-charcoal">{startRange}</span>–<span className="font-semibold text-charcoal">{endRange}</span> of <span className="font-semibold text-charcoal">{total}</span> products
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-30 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={cn(
                  "w-9 h-9 rounded-lg border text-sm font-semibold transition-all",
                  p === page
                    ? "bg-primary border-primary text-white shadow-sm"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                )}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-30 hover:bg-gray-50 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-charcoal mb-2">Delete Product?</h3>
            <p className="text-sm text-gray-500 mb-6">
              This action cannot be undone. You won't be able to list new deals for this product.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 h-11 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete(deleteConfirm);
                  setDeleteConfirm(null);
                }}
                className="flex-1 h-11 rounded-lg bg-red-500 text-sm font-semibold text-white hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
