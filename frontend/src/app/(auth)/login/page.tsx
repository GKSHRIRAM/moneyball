"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { isAxiosError } from "axios";
import { UserRole } from "@/types/auth";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { success, error } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const role = await login({
        email: formData.email,
        password: formData.password,
      });

      success("Logged in successfully!");
      if (role === UserRole.retailer) {
        router.push("/dashboard");
      } else {
        router.push("/deals");
      }
    } catch (err: any) {
      if (isAxiosError(err) && err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === "string") {
          error(detail);
        } else if (Array.isArray(detail) && detail.length > 0) {
          error(detail.map(d => `${d.loc?.[1] || d.loc?.[0] || 'Field'}: ${d.msg}`).join(", "));
        } else {
          error("Invalid email or password.");
        }
      } else {
        error("Invalid email or password.");
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
        {/* Logo Banner */}
        <div className="mb-8 text-center bg-charcoal p-4 rounded-xl shadow-sm text-white flex justify-center items-center gap-2">
          <h2 className="text-2xl font-black italic tracking-tighter">
            <span className="text-white">Deal</span>
            <span className="text-primary">Drop</span>
          </h2>
        </div>

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-charcoal">Welcome back</h2>
            <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input
              label="Email Address"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              placeholder="name@example.com"
            />

            <Input
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              value={formData.password}
              onChange={handleInputChange}
              placeholder="••••••••"
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              }
            />

            <Button fullWidth type="submit" isLoading={isLoading}>
              Sign In
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link href="/register" className="font-semibold text-primary hover:text-[#D9460A] transition-colors">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
