/**
 * Store-related types matching backend schemas.
 */

export enum StoreCategory {
  bakery = "bakery",
  grocery = "grocery",
  fmcg = "fmcg",
}

export enum FulfillmentMode {
  pickup = "pickup",
  delivery = "delivery",
  both = "both",
}

export interface StorePolicy {
  id: string;
  store_id: string;
  min_discount_pct: number;
  auto_approve: boolean;
  fulfillment_mode: FulfillmentMode;
  hide_outside_hours: boolean;
  enabled_categories: string[];
}

export interface Store {
  id: string;
  user_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  category: StoreCategory;
  phone: string | null;
  open_time: string | null;
  close_time: string | null;
  is_active: boolean;
  created_at: string;
  policy: StorePolicy | null;
}

export interface StoreCreateRequest {
  name: string;
  address: string;
  lat: number;
  lng: number;
  category: StoreCategory;
  phone?: string;
  open_time?: string;
  close_time?: string;
}

export interface StoreUpdateRequest {
  name?: string;
  address?: string;
  lat?: number;
  lng?: number;
  category?: StoreCategory;
  phone?: string;
  open_time?: string;
  close_time?: string;
}

export interface StorePolicyCreateRequest {
  min_discount_pct: number;
  auto_approve: boolean;
  fulfillment_mode: FulfillmentMode;
  hide_outside_hours: boolean;
  enabled_categories: string[];
}

export interface OnboardingStatus {
  has_store: boolean;
  has_policy: boolean;
  is_complete: boolean;
}
