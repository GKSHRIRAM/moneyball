import { create } from "zustand";
import { decodeToken, getAccessToken, clearTokens, setTokens } from "@/lib/auth";
import { UserRole, AuthResponse, User } from "@/types/auth";
import api from "@/lib/api";

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

    // Set authenticated immediately from JWT so protected routes render
    set({
      user: {
        id: decoded.sub,
        email: "",
        role: decoded.role as UserRole,
        name: "",
        is_active: true,
        created_at: "",
      },
      isAuthenticated: true,
      isLoading: false,
    });

    // Then fetch full user profile in background
    api.get<User>("/users/me").then((res) => {
      set({ user: res.data });
      // Keep the cookie in sync with the actual role
      document.cookie = `dealdrop_role=${res.data.role}; path=/`;
    }).catch(() => {
      // If /users/me fails (e.g. token truly invalid), clear auth
      clearTokens();
      document.cookie = "dealdrop_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      set({ user: null, isAuthenticated: false, isLoading: false });
    });
  },
}));
