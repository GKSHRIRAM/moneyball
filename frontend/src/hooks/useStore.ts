import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  Store,
  StorePolicy,
  StoreCreateRequest,
  StoreUpdateRequest,
  StorePolicyCreateRequest,
  OnboardingStatus,
} from "@/types/store";

export function useMyStore() {
  return useQuery<Store | null>({
    queryKey: ["my-store"],
    queryFn: async () => {
      try {
        const { data } = await api.get<Store>("/stores/me");
        return data;
      } catch (err: any) {
        if (err.response?.status === 404) return null;
        throw err;
      }
    },
    retry: false,
  });
}

export function useOnboardingStatus() {
  return useQuery<OnboardingStatus>({
    queryKey: ["onboarding-status"],
    queryFn: async () => {
      const { data } = await api.get<OnboardingStatus>(
        "/stores/me/onboarding"
      );
      return data;
    },
    // Refetch when window regains focus (e.g. after completing onboarding)
    refetchOnWindowFocus: true,
  });
}

export function useCreateStore() {
  const queryClient = useQueryClient();
  return useMutation<Store, Error, StoreCreateRequest>({
    mutationFn: async (payload) => {
      const { data } = await api.post<Store>("/stores", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-store"] });
      queryClient.invalidateQueries({ queryKey: ["onboarding-status"] });
    },
  });
}

export function useUpdateStore() {
  const queryClient = useQueryClient();
  return useMutation<Store, Error, StoreUpdateRequest>({
    mutationFn: async (payload) => {
      const { data } = await api.put<Store>("/stores/me", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-store"] });
    },
  });
}

export function useSavePolicy() {
  const queryClient = useQueryClient();
  return useMutation<StorePolicy, Error, StorePolicyCreateRequest>({
    mutationFn: async (payload) => {
      const { data } = await api.post<StorePolicy>(
        "/stores/me/policies",
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-store"] });
      queryClient.invalidateQueries({ queryKey: ["onboarding-status"] });
    },
  });
}
