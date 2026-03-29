"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { useMyStore, useUpdateStore, useSavePolicy } from "@/hooks/useStore";
import { Spinner } from "@/components/ui/Spinner";
import {
  StoreCategory,
  FulfillmentMode,
  StoreUpdateRequest,
  StorePolicyCreateRequest,
} from "@/types/store";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: StoreCategory.bakery, label: "🍞 Bakery" },
  { value: StoreCategory.grocery, label: "🛒 Grocery" },
  { value: StoreCategory.fmcg, label: "🧴 FMCG" },
];

export default function SettingsPage() {
  const toast = useToast();
  const { data: store, isLoading: storeLoading } = useMyStore();
  const updateStoreMutation = useUpdateStore();
  const savePolicyMutation = useSavePolicy();

  // Store profile form
  const [storeName, setStoreName] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState<StoreCategory>(StoreCategory.bakery);
  const [phone, setPhone] = useState("");
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");

  // Policy form
  const [minDiscountPct, setMinDiscountPct] = useState(15);
  const [autoApprove, setAutoApprove] = useState(false);
  const [fulfillmentMode, setFulfillmentMode] = useState<FulfillmentMode>(FulfillmentMode.pickup);
  const [hideOutsideHours, setHideOutsideHours] = useState(false);

  // Pre-fill on store load
  useEffect(() => {
    if (store) {
      setStoreName(store.name);
      setAddress(store.address);
      setCategory(store.category);
      setPhone(store.phone || "");
      setOpenTime(store.open_time || "");
      setCloseTime(store.close_time || "");

      if (store.policy) {
        setMinDiscountPct(store.policy.min_discount_pct);
        setAutoApprove(store.policy.auto_approve);
        setFulfillmentMode(store.policy.fulfillment_mode);
        setHideOutsideHours(store.policy.hide_outside_hours);
      }
    }
  }, [store]);

  const handleSaveStore = async () => {
    try {
      const payload: StoreUpdateRequest = {
        name: storeName,
        address,
        category,
        phone: phone || undefined,
        open_time: openTime || undefined,
        close_time: closeTime || undefined,
      };
      await updateStoreMutation.mutateAsync(payload);
      toast.success("Store profile updated!");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to update store");
    }
  };

  const handleSavePolicy = async () => {
    try {
      const payload: StorePolicyCreateRequest = {
        min_discount_pct: minDiscountPct,
        auto_approve: autoApprove,
        fulfillment_mode: fulfillmentMode,
        hide_outside_hours: hideOutsideHours,
        enabled_categories: ["bakery", "grocery", "fmcg"],
      };
      await savePolicyMutation.mutateAsync(payload);
      toast.success("Listing policies updated!");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to update policies");
    }
  };

  if (storeLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" className="text-primary" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="p-8 text-center text-gray-500">
        No store found. Please complete onboarding first.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-charcoal">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your store profile and listing policies</p>
      </div>

      {/* ── Section 1: Store Profile ──────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        <h2 className="text-lg font-semibold text-charcoal border-b border-gray-100 pb-3">
          Store Profile
        </h2>

        <Input
          label="Store Name"
          name="storeName"
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
        />

        <Input
          label="Address"
          name="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-charcoal">Category</label>
          <div className="grid grid-cols-3 gap-3">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={cn(
                  "p-3 rounded-lg border-2 text-center text-sm font-medium transition-all",
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
          label="Phone"
          name="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-charcoal">Open Time</label>
            <input
              type="time"
              value={openTime}
              onChange={(e) => setOpenTime(e.target.value)}
              className="w-full h-12 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-charcoal">Close Time</label>
            <input
              type="time"
              value={closeTime}
              onChange={(e) => setCloseTime(e.target.value)}
              className="w-full h-12 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <Button
          onClick={handleSaveStore}
          isLoading={updateStoreMutation.isPending}
        >
          Save Changes
        </Button>
      </div>

      {/* ── Section 2: Listing Policies ──────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        <h2 className="text-lg font-semibold text-charcoal border-b border-gray-100 pb-3">
          Listing Policies
        </h2>

        {/* Min discount slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-charcoal">
              Minimum discount to list publicly
            </label>
            <span className="text-xs font-semibold bg-primary text-white px-2.5 py-1 rounded-full">
              {minDiscountPct}%
            </span>
          </div>
          <input
            type="range"
            min={5}
            max={80}
            value={minDiscountPct}
            onChange={(e) => setMinDiscountPct(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>

        {/* Auto-approve */}
        <div className="flex items-center justify-between p-4 bg-surface rounded-lg">
          <div>
            <span className="text-sm font-medium text-charcoal">Auto-approve</span>
            <p className="text-xs text-gray-500 mt-0.5">Auto-list when risk is high</p>
          </div>
          <button
            type="button"
            onClick={() => setAutoApprove(!autoApprove)}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0",
              autoApprove ? "bg-primary" : "bg-gray-300"
            )}
          >
            <span className={cn(
              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
              autoApprove ? "translate-x-6" : "translate-x-1"
            )} />
          </button>
        </div>

        {/* Fulfillment mode */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-charcoal">Fulfillment mode</label>
          <div className="flex gap-2">
            {([
              { v: FulfillmentMode.pickup, l: "Pickup" },
              { v: FulfillmentMode.delivery, l: "Delivery" },
              { v: FulfillmentMode.both, l: "Both" },
            ] as const).map(({ v, l }) => (
              <button
                key={v}
                type="button"
                onClick={() => setFulfillmentMode(v)}
                className={cn(
                  "flex-1 py-2.5 px-3 rounded-lg text-sm font-medium border-2 transition-all",
                  fulfillmentMode === v
                    ? "border-primary bg-orange-50 text-primary"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Hide outside hours */}
        <div className="flex items-center justify-between p-4 bg-surface rounded-lg">
          <span className="text-sm font-medium text-charcoal">Hide outside business hours</span>
          <button
            type="button"
            onClick={() => setHideOutsideHours(!hideOutsideHours)}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0",
              hideOutsideHours ? "bg-primary" : "bg-gray-300"
            )}
          >
            <span className={cn(
              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
              hideOutsideHours ? "translate-x-6" : "translate-x-1"
            )} />
          </button>
        </div>

        <Button
          onClick={handleSavePolicy}
          isLoading={savePolicyMutation.isPending}
        >
          Save Policies
        </Button>
      </div>
    </div>
  );
}
