import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Deal, DealCreateRequest, DealSuggestion, DealListResponse } from "@/types/deal";

export function useDealSuggestions() {
  return useQuery({
    queryKey: ["deals", "suggestions"],
    queryFn: async () => {
      const { data } = await api.get<DealSuggestion[]>("/deals/suggestions");
      return data;
    },
  });
}

export function useRetailerDeals(status?: string) {
  return useQuery({
    queryKey: ["deals", "retailer", { status }],
    queryFn: async () => {
      const url = status ? `/deals?status=${status}` : "/deals";
      const { data } = await api.get<DealListResponse>(url);
      return data;
    },
  });
}

export function useRetailerDeal(id: string) {
  return useQuery({
    queryKey: ["deals", id],
    queryFn: async () => {
      const { data } = await api.get<Deal>(`/deals/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: DealCreateRequest) => {
      const { data } = await api.post<Deal>("/deals", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useApproveDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.put<Deal>(`/deals/${id}/approve`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    },
  });
}

export function useCloseDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.put<Deal>(`/deals/${id}/close`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useRescoreProducts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/products/rescore");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["deals", "suggestions"] });
    },
  });
}
