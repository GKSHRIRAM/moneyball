/**
 * Product-related types matching backend schemas.
 */

import { StoreCategory } from "./store";

export type RiskLabel = "safe" | "watch" | "urgent" | "critical";

export interface Product {
  id: string;
  store_id: string;
  name: string;
  category: StoreCategory;
  mrp: number;
  cost_price: number;
  batch_number: string | null;
  expiry_date: string;
  quantity: number;
  risk_score: number;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  days_to_expiry: number;
  risk_label: RiskLabel;
}

export interface ProductCreateRequest {
  name: string;
  category: StoreCategory;
  mrp: number;
  cost_price: number;
  batch_number?: string;
  expiry_date: string;
  quantity: number;
  image_url?: string;
}

export interface ProductUpdateRequest {
  name?: string;
  category?: StoreCategory;
  mrp?: number;
  cost_price?: number;
  batch_number?: string;
  expiry_date?: string;
  quantity?: number;
  image_url?: string;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  page_size: number;
}

export interface CSVUploadResponse {
  created: number;
  skipped: number;
  errors: string[];
}

export interface ProductRisk {
  product_id: string;
  risk_score: number;
  risk_label: RiskLabel;
  days_to_expiry: number;
  suggested_discount_pct: number;
}
