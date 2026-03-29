import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  Product,
  ProductListResponse,
  ProductCreateRequest,
  ProductUpdateRequest,
  CSVUploadResponse,
  ProductRisk,
} from "@/types/product";

interface ProductFilters {
  page?: number;
  page_size?: number;
  category?: string;
  expiry_filter?: string;
  risk_filter?: string;
}

export function useProducts(filters: ProductFilters = {}) {
  return useQuery<ProductListResponse>({
    queryKey: ["products", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.page) params.set("page", String(filters.page));
      if (filters.page_size) params.set("page_size", String(filters.page_size));
      if (filters.category) params.set("category", filters.category);
      if (filters.expiry_filter) params.set("expiry_filter", filters.expiry_filter);
      if (filters.risk_filter) params.set("risk_filter", filters.risk_filter);
      const { data } = await api.get<ProductListResponse>(
        `/products?${params.toString()}`
      );
      return data;
    },
  });
}

export function useProduct(id: string) {
  return useQuery<Product>({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data } = await api.get<Product>(`/products/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation<Product, Error, ProductCreateRequest>({
    mutationFn: async (payload) => {
      const { data } = await api.post<Product>("/products", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation<Product, Error, { id: string; data: ProductUpdateRequest }>({
    mutationFn: async ({ id, data: payload }) => {
      const { data } = await api.put<Product>(`/products/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["product"] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/products/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useBulkUpload() {
  const qc = useQueryClient();
  return useMutation<CSVUploadResponse, Error, File>({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post<CSVUploadResponse>(
        "/products/bulk-upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useProductRisk(id: string) {
  return useQuery<ProductRisk>({
    queryKey: ["product-risk", id],
    queryFn: async () => {
      const { data } = await api.get<ProductRisk>(`/products/${id}/risk`);
      return data;
    },
    enabled: !!id,
  });
}
