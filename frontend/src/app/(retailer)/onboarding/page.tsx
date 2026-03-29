"use client";

import StoreSetupWizard from "@/components/retailer/StoreSetupWizard";

export default function OnboardingPage() {
  return (
    <div className="min-h-[calc(100vh-56px)] lg:min-h-screen bg-surface">
      <div className="py-6">
        <div className="text-center mb-2">
          <h1 className="text-2xl font-bold text-charcoal">Welcome to DealDrop</h1>
          <p className="text-gray-500 text-sm mt-1">
            Let's set up your store in a few quick steps
          </p>
        </div>
        <StoreSetupWizard />
      </div>
    </div>
  );
}
