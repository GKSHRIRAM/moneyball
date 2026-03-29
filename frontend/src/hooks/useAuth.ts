import { useState, useCallback, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { LoginRequest, RegisterRequest, AuthResponse, UserRole } from "@/types/auth";

export function useAuth() {
  const { user, isAuthenticated, isLoading, login: storeLogin, logout: storeLogout, hydrate, setLoading } = useAuthStore();

  const [isAuthLoading, setIsAuthLoading] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const login = useCallback(
    async (data: LoginRequest): Promise<UserRole> => {
      setIsAuthLoading(true);
      try {
        const response = await api.post<AuthResponse>("/auth/login", data);
        storeLogin(response.data);
        return response.data.user.role;
      } finally {
        setIsAuthLoading(false);
      }
    },
    [storeLogin]
  );

  const register = useCallback(
    async (data: RegisterRequest): Promise<UserRole> => {
      setIsAuthLoading(true);
      try {
        const response = await api.post<AuthResponse>("/auth/register", data);
        storeLogin(response.data);
        return response.data.user.role;
      } finally {
        setIsAuthLoading(false);
      }
    },
    [storeLogin]
  );

  const logout = useCallback(async () => {
    try {
      if (isAuthenticated) {
        await api.post("/auth/logout");
      }
    } catch (e) {
      console.warn("Backend logout failed, continuing with client logout", e);
    } finally {
      storeLogout();
    }
  }, [isAuthenticated, storeLogout]);

  return {
    user,
    isAuthenticated,
    // Combine hydration loading and request loading
    isLoading: isLoading || isAuthLoading,
    login,
    register,
    logout,
  };
}
