"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Clock,
  Store as StoreIcon,
  Shield,
  Check,
  LocateFixed,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { useCreateStore, useSavePolicy } from "@/hooks/useStore";
import {
  StoreCategory,
  FulfillmentMode,
  StoreCreateRequest,
  StorePolicyCreateRequest,
} from "@/types/store";
import { cn } from "@/lib/utils";

const STEPS = [
  { label: "Store Info", icon: StoreIcon },
  { label: "Location", icon: MapPin },
  { label: "Hours", icon: Clock },
  { label: "Policies", icon: Shield },
];

const CATEGORIES = [
  { value: StoreCategory.bakery, label: "🍞 Bakery" },
  { value: StoreCategory.grocery, label: "🛒 Grocery" },
  { value: StoreCategory.fmcg, label: "🧴 FMCG" },
];

interface WizardProps {
  initialStep?: number;
}

export default function StoreSetupWizard({ initialStep = 0 }: WizardProps) {
  const router = useRouter();
  const toast = useToast();
  const createStoreMutation = useCreateStore();
  const savePolicyMutation = useSavePolicy();

  const [step, setStep] = useState(initialStep);

  // Step 1 — Store Info
  const [storeName, setStoreName] = useState("");
  const [category, setCategory] = useState<StoreCategory>(StoreCategory.bakery);
  const [phone, setPhone] = useState("");

  // Step 2 — Location
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [geoStatus, setGeoStatus] = useState<"idle" | "detecting" | "success" | "denied">("idle");

  // Step 3 — Hours
  const [setHours, setSetHours] = useState(false);
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("21:00");

  // Step 4 — Policies
  const [minDiscountPct, setMinDiscountPct] = useState(15);
  const [autoApprove, setAutoApprove] = useState(false);
  const [fulfillmentMode, setFulfillmentMode] = useState<FulfillmentMode>(FulfillmentMode.pickup);
  const [hideOutsideHours, setHideOutsideHours] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDetectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoStatus("denied");
      return;
    }
    setGeoStatus("detecting");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        // Reverse geocode via Nominatim (free, no key)
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
          );
          const data = await resp.json();
          if (data.display_name) {
            setAddress(data.display_name);
          }
        } catch {
          // Geocoding failed, but lat/lng are still set
        }
        setGeoStatus("success");
      },
      () => {
        setGeoStatus("denied");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      // 1. Create store
      const storePayload: StoreCreateRequest = {
        name: storeName,
        address,
        lat: lat!,
        lng: lng!,
        category,
        phone: phone || undefined,
        open_time: setHours ? openTime : undefined,
        close_time: setHours ? closeTime : undefined,
      };
      await createStoreMutation.mutateAsync(storePayload);

      // 2. Save policies
      const policyPayload: StorePolicyCreateRequest = {
        min_discount_pct: minDiscountPct,
        auto_approve: autoApprove,
        fulfillment_mode: fulfillmentMode,
        hide_outside_hours: hideOutsideHours,
        enabled_categories: ["bakery", "grocery", "fmcg"],
      };
      await savePolicyMutation.mutateAsync(policyPayload);

      toast.success("Store setup complete! 🎉");
      router.push("/dashboard");
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || "Setup failed";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0: return storeName.length >= 2;
      case 1: return lat !== null && lng !== null && address.length > 0;
      case 2: return true;
      case 3: return true;
      default: return false;
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* ── Step Indicator ──────────────────────────────────── */}
      <div className="flex items-center justify-between mb-10">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isComplete = i < step;
          const isActive = i === step;
          return (
            <div key={i} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                    isComplete && "bg-green-500 text-white",
                    isActive && "bg-primary text-white shadow-lg shadow-primary/30",
                    !isComplete && !isActive && "bg-gray-200 text-gray-500"
                  )}
                >
                  {isComplete ? <Check size={18} /> : <Icon size={18} />}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium hidden sm:block",
                    isActive ? "text-primary" : "text-gray-400"
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 transition-colors",
                    isComplete ? "bg-green-500" : "bg-gray-200"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Step Content ──────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">

        {/* Step 1: Store Info */}
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-charcoal">Store Information</h2>
              <p className="text-sm text-gray-500 mt-1">Tell us about your business</p>
            </div>

            <Input
              label="Store Name"
              name="storeName"
              required
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="e.g. Fresh Bakes Corner"
            />

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-charcoal">Category *</label>
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
              label="Phone (Optional)"
              name="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
            />
          </div>
        )}

        {/* Step 2: Location */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-charcoal">Store Location</h2>
              <p className="text-sm text-gray-500 mt-1">Help customers find your store</p>
            </div>

            <Input
              label="Full Address"
              name="address"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St, City, State"
            />

            <Button
              variant="secondary"
              onClick={handleDetectLocation}
              isLoading={geoStatus === "detecting"}
              fullWidth
              type="button"
            >
              <LocateFixed size={16} className="mr-2" />
              Detect my location
            </Button>

            {geoStatus === "success" && lat && lng && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <MapPin className="text-green-600 w-5 h-5 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800">Location detected</p>
                  <p className="text-xs text-green-600 mt-1 line-clamp-2">{address}</p>
                  <p className="text-xs text-green-500 mt-0.5">
                    {lat.toFixed(6)}, {lng.toFixed(6)}
                  </p>
                </div>
              </div>
            )}

            {geoStatus === "denied" && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="text-amber-600 w-5 h-5 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Location access denied</p>
                  <p className="text-xs text-amber-600 mt-1">
                    Please enter your coordinates manually below.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Latitude"
                name="lat"
                type="number"
                value={lat?.toString() || ""}
                onChange={(e) => setLat(e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="12.9716"
              />
              <Input
                label="Longitude"
                name="lng"
                type="number"
                value={lng?.toString() || ""}
                onChange={(e) => setLng(e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="77.5946"
              />
            </div>
          </div>
        )}

        {/* Step 3: Operating Hours */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-charcoal">Operating Hours</h2>
              <p className="text-sm text-gray-500 mt-1">When is your store open?</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-surface rounded-lg">
              <span className="text-sm font-medium text-charcoal">Set operating hours?</span>
              <button
                type="button"
                onClick={() => setSetHours(!setHours)}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  setHours ? "bg-primary" : "bg-gray-300"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    setHours ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>

            {setHours && (
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
            )}
          </div>
        )}

        {/* Step 4: Listing Policies */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-charcoal">Listing Policies</h2>
              <p className="text-sm text-gray-500 mt-1">
                How should DealDrop manage your listings? You can change these anytime in Settings.
              </p>
            </div>

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
              <div className="flex justify-between text-xs text-gray-400">
                <span>5%</span>
                <span>80%</span>
              </div>
            </div>

            {/* Auto-approve toggle */}
            <div className="flex items-center justify-between p-4 bg-surface rounded-lg">
              <div>
                <span className="text-sm font-medium text-charcoal">
                  Auto-approve near-expiry listings?
                </span>
                <p className="text-xs text-gray-500 mt-0.5">
                  When ON, deals are listed automatically when risk is high.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAutoApprove(!autoApprove)}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ml-4",
                  autoApprove ? "bg-primary" : "bg-gray-300"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    autoApprove ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>

            {/* Fulfillment mode pills */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-charcoal">Fulfillment mode</label>
              <div className="flex gap-2">
                {(
                  [
                    { v: FulfillmentMode.pickup, l: "Pickup Only" },
                    { v: FulfillmentMode.delivery, l: "Delivery" },
                    { v: FulfillmentMode.both, l: "Both" },
                  ] as const
                ).map(({ v, l }) => (
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
              <span className="text-sm font-medium text-charcoal">
                Hide deals outside business hours?
              </span>
              <button
                type="button"
                onClick={() => setHideOutsideHours(!hideOutsideHours)}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0",
                  hideOutsideHours ? "bg-primary" : "bg-gray-300"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    hideOutsideHours ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>
          </div>
        )}

        {/* ── Navigation Buttons ──────────────────────────── */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep(step - 1)} type="button">
              ← Back
            </Button>
          ) : (
            <div />
          )}

          {step < STEPS.length - 1 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              type="button"
            >
              Next →
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              isLoading={isSubmitting}
              fullWidth={false}
              type="button"
            >
              Finish Setup
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
