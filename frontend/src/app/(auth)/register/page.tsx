"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShoppingBag, Store, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { UserRole } from "@/types/auth";
import { isAxiosError } from "axios";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const { success, error } = useToast();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleNext = () => {
    if (selectedRole) setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.name.length < 2) return error("Name must be at least 2 characters.");
    if (formData.password.length < 8) return error("Password must be at least 8 characters.");
    if (formData.password !== formData.confirm) return error("Passwords do not match.");
    if (!selectedRole) return error("Please select a role.");

    setIsLoading(true);
    try {
      const returnedRole = await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        password: formData.password,
        role: selectedRole,
      });

      success("Account created successfully!");
      if (returnedRole === UserRole.retailer) {
        router.push("/dashboard");
      } else {
        router.push("/deals");
      }
    } catch (err: any) {
      if (isAxiosError(err) && err.response?.data?.detail) {
        error(err.response.data.detail);
      } else {
        error("Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Header Band Placeholder */}
        <div className="mb-8 text-center bg-charcoal p-4 rounded-xl shadow-sm text-white flex justify-center items-center gap-2">
           <h2 className="text-2xl font-black italic tracking-tighter">
            <span className="text-white">Deal</span>
            <span className="text-primary">Drop</span>
          </h2>
        </div>

        {step === 1 ? (
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-charcoal">Join DealDrop</h2>
              <p className="text-sm text-gray-500 mt-1">How do you want to use the platform?</p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <button
                type="button"
                onClick={() => setSelectedRole(UserRole.consumer)}
                className={`flex-1 flex flex-col items-center bg-surface p-6 rounded-lg border-2 transition-colors ${
                  selectedRole === UserRole.consumer
                    ? "border-primary bg-orange-50/50"
                    : "border-gray-200 hover:border-primary/50"
                }`}
              >
                <div className="p-3 bg-white rounded-full shadow-sm mb-3">
                  <ShoppingBag className="text-primary w-6 h-6" />
                </div>
                <h3 className="font-semibold text-charcoal">Consumer</h3>
                <p className="text-xs text-center text-gray-500 mt-1">Find deals near you</p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole(UserRole.retailer)}
                className={`flex-1 flex flex-col items-center bg-surface p-6 rounded-lg border-2 transition-colors ${
                  selectedRole === UserRole.retailer
                    ? "border-primary bg-orange-50/50"
                    : "border-gray-200 hover:border-primary/50"
                }`}
              >
                <div className="p-3 bg-white rounded-full shadow-sm mb-3">
                  <Store className="text-primary w-6 h-6" />
                </div>
                <h3 className="font-semibold text-charcoal">Retailer</h3>
                <p className="text-xs text-center text-gray-500 mt-1">List your surplus stock</p>
              </button>
            </div>

            <div className="mt-8">
              <Button fullWidth disabled={!selectedRole} onClick={handleNext}>
                Continue
              </Button>
            </div>

            <div className="mt-6 text-center text-sm text-charcoal">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-primary hover:text-[#D9460A]">
                Log in
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="mb-6 flex items-center justify-between">
              <button
                onClick={() => setStep(1)}
                className="p-2 text-gray-500 hover:bg-surface rounded-full transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-xl font-bold text-charcoal text-center flex-1 pr-10">
                Create your account
              </h2>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <Input
                label="Full Name"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                placeholder="John Doe"
              />

              <Input
                label="Email Address"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                placeholder="john@example.com"
              />

              <Input
                label="Phone (Optional)"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+1 234 567 8900"
              />

              <Input
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={handleInputChange}
                placeholder="min 8 chars"
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                }
              />

              <Input
                label="Confirm Password"
                name="confirm"
                type={showPassword ? "text" : "password"}
                required
                value={formData.confirm}
                onChange={handleInputChange}
                placeholder="Re-enter password"
              />

              <div className="pt-2">
                <Button fullWidth type="submit" isLoading={isLoading}>
                  Create Account
                </Button>
              </div>
            </form>

            <div className="mt-6 text-center text-sm text-charcoal">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-primary hover:text-[#D9460A]">
                Log in
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
