"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, PackagePlus, AlertCircle } from "lucide-react";
import Link from "next/link";
import { ProductForm } from "@/components/retailer/ProductForm";
import { useCreateProduct } from "@/hooks/useProducts";
import { useToast } from "@/components/ui/Toast";
import { ProductCreateRequest } from "@/types/product";

export default function AddProductPage() {
  const router = useRouter();
  const toast = useToast();
  const createProduct = useCreateProduct();

  const handleSubmit = async (data: any) => {
    try {
      await createProduct.mutateAsync(data as ProductCreateRequest);
      toast.success("Product added successfully! 🎉");
      router.push("/products");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to add product");
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Breadcrumb / Back */}
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

      {/* Header */}
      <div className="mb-10 flex items-start gap-4 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50/50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
          <PackagePlus className="w-7 h-7 text-primary" />
        </div>
        <div className="flex-1 min-w-0 pt-1">
          <h1 className="text-2xl font-black text-charcoal leading-none">Add New Product</h1>
          <p className="text-sm text-gray-500 mt-2 max-w-sm">
            Enter the details for your new stock item. These details will be used to track risk and suggest marking down.
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 relative">
        <ProductForm 
          mode="add" 
          onSubmit={handleSubmit} 
          isLoading={createProduct.isPending} 
        />
        
        {/* Info panel */}
        <div className="mt-8 flex items-start gap-3 p-4 bg-orange-50 border border-orange-100 rounded-xl">
          <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-primary">Pro Tip: Expiry Accuracy</p>
            <p className="text-xs text-orange-700/80 mt-1 leading-relaxed">
              Ensure your expiry dates are accurate to get the most out of our risk engine. 
              The system will automatically suggest markdown deals as the product approaches its date.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
