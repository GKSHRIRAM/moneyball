import { create } from "zustand";
import { decodeToken, getAccessToken, clearTokens, setTokens } from "@/lib/auth";
import { UserRole, AuthResponse, User } from "@/types/auth";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (response: AuthResponse) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: (response: AuthResponse) => {
    setTokens(response.access_token, response.refresh_token);
    document.cookie = `dealdrop_role=${response.user.role}; path=/`;
    set({ user: response.user, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    clearTokens();
    document.cookie = "dealdrop_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  setLoading: (loading) => set({ isLoading: loading }),

  hydrate: () => {
    const token = getAccessToken();
    if (!token) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    const decoded = decodeToken(token);
    if (!decoded || decoded.exp * 1000 < Date.now()) {
      clearTokens();
      document.cookie = "dealdrop_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    // Since we only store sub + role in JWT, we create a stub User.
    // In a real app we would call /users/me here to get full details.
    set({
      user: {
        id: decoded.sub,
        email: "",
        role: decoded.role as UserRole,
        name: "User", // Will be populated when we implement /users/me
        is_active: true,
        created_at: "",
      },
      isAuthenticated: true,
      isLoading: false,
    });
  },
}));
