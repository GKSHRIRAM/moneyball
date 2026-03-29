"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { StoreCategory } from "@/types/store";
import { Product, ProductCreateRequest, ProductUpdateRequest } from "@/types/product";

const CATEGORIES = [
  { value: StoreCategory.bakery, label: "🍞 Bakery" },
  { value: StoreCategory.grocery, label: "🛒 Grocery" },
  { value: StoreCategory.fmcg, label: "🧴 FMCG" },
];

interface ProductFormProps {
  initialData?: Product | null;
  onSubmit: (data: ProductCreateRequest | ProductUpdateRequest) => Promise<void>;
  isLoading: boolean;
  mode: "add" | "edit";
}

export function ProductForm({ initialData, onSubmit, isLoading, mode }: ProductFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [category, setCategory] = useState<StoreCategory>(
    initialData?.category || StoreCategory.bakery
  );
  const [mrp, setMrp] = useState(initialData?.mrp?.toString() || "");
  const [costPrice, setCostPrice] = useState(initialData?.cost_price?.toString() || "");
  const [batchNumber, setBatchNumber] = useState(initialData?.batch_number || "");
  const [expiryDate, setExpiryDate] = useState(
    initialData?.expiry_date || ""
  );
  const [quantity, setQuantity] = useState(initialData?.quantity?.toString() || "");
  const [imageUrl, setImageUrl] = useState(initialData?.image_url || "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const today = new Date().toISOString().split("T")[0];

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name || name.length < 2) newErrors.name = "Name must be at least 2 characters";
    if (!mrp || parseFloat(mrp) <= 0) newErrors.mrp = "MRP must be a positive number";
    if (!costPrice || parseFloat(costPrice) <= 0) newErrors.costPrice = "Cost price must be positive";
    if (mrp && costPrice && parseFloat(costPrice) > parseFloat(mrp)) {
      newErrors.costPrice = "Cost price cannot exceed MRP";
    }
    if (mode === "add" && (!expiryDate || expiryDate < today)) {
      newErrors.expiryDate = "Expiry date must be today or in the future";
    }
    if (mode === "edit" && expiryDate && expiryDate < today) {
      newErrors.expiryDate = "Expiry date must be today or in the future";
    }
    if (mode === "add" && (!quantity || parseInt(quantity) <= 0)) {
      newErrors.quantity = "Quantity must be a positive integer";
    }
    if (mode === "edit" && quantity && parseInt(quantity) <= 0) {
      newErrors.quantity = "Quantity must be a positive integer";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (mode === "add") {
      const data: ProductCreateRequest = {
        name,
        category,
        mrp: parseFloat(mrp),
        cost_price: parseFloat(costPrice),
        batch_number: batchNumber || undefined,
        expiry_date: expiryDate,
        quantity: parseInt(quantity),
        image_url: imageUrl || undefined,
      };
      await onSubmit(data);
    } else {
      // Only send changed fields
      const data: ProductUpdateRequest = {};
      if (name !== initialData?.name) data.name = name;
      if (category !== initialData?.category) data.category = category;
      if (parseFloat(mrp) !== initialData?.mrp) data.mrp = parseFloat(mrp);
      if (parseFloat(costPrice) !== initialData?.cost_price) data.cost_price = parseFloat(costPrice);
      if (batchNumber !== (initialData?.batch_number || "")) data.batch_number = batchNumber || undefined;
      if (expiryDate !== initialData?.expiry_date) data.expiry_date = expiryDate || undefined;
      if (parseInt(quantity) !== initialData?.quantity) data.quantity = parseInt(quantity);
      if (imageUrl !== (initialData?.image_url || "")) data.image_url = imageUrl || undefined;
      await onSubmit(data);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          <Input
            label="Product Name"
            name="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Whole Wheat Bread"
            error={errors.name}
          />

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-charcoal">
              Category <span className="text-primary">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={cn(
                    "p-2.5 rounded-lg border-2 text-center text-sm font-medium transition-all",
                    category === c.value
                      ? "border-primary bg-orange-50 text-primary"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="MRP (₹)"
            name="mrp"
            type="number"
            required
            value={mrp}
            onChange={(e) => setMrp(e.target.value)}
            placeholder="0.00"
            error={errors.mrp}
          />

          <Input
            label="Cost Price (₹)"
            name="costPrice"
            type="number"
            required
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
            placeholder="0.00"
            error={errors.costPrice}
          />
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <Input
            label="Batch Number"
            name="batchNumber"
            value={batchNumber}
            onChange={(e) => setBatchNumber(e.target.value)}
            placeholder="BATCH001 (optional)"
          />

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-charcoal">
              Expiry Date <span className="text-primary">*</span>
            </label>
            <input
              type="date"
              min={today}
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className={cn(
                "w-full h-12 rounded-md border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                errors.expiryDate ? "border-red-500" : "border-gray-300"
              )}
            />
            {errors.expiryDate && (
              <span className="text-xs text-red-500">{errors.expiryDate}</span>
            )}
          </div>

          <Input
            label="Quantity"
            name="quantity"
            type="number"
            required
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="1"
            error={errors.quantity}
          />

          <Input
            label="Product Image URL"
            name="imageUrl"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://... (optional)"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <Button type="submit" isLoading={isLoading}>
          {mode === "add" ? "Add Product" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

export default ProductForm;
