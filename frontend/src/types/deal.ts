export enum DealType {
  clearance = "clearance",
  flash = "flash",
  happy_hour = "happy_hour",
}

export enum DealStatus {
  draft = "draft",
  active = "active",
  reserved = "reserved",
  expired = "expired",
  cancelled = "cancelled",
}

export interface Deal {
  id: string;
  store_id: string;
  product_id: string;
  deal_price: number;
  original_price: number;
  discount_pct: number;
  quantity_available: number;
  expiry_date: string;
  deal_type: DealType;
  status: DealStatus;
  listed_at: string | null;
  risk_score_at_listing: number;
  
  product_name?: string;
  store_name?: string;
  days_to_expiry?: number;
  is_urgent?: boolean;
}

export interface DealCreateRequest {
  product_id: string;
  deal_price: number;
  quantity_to_list: number;
  deal_type?: DealType;
}

export interface DealSuggestion {
  product_id: string;
  product_name: string;
  category: string;
  mrp: number;
  suggested_discount_pct: number;
  suggested_deal_price: number;
  risk_score: number;
  risk_label: "safe" | "watch" | "urgent" | "critical";
  days_to_expiry: number;
  quantity: number;
}

export interface DealListResponse {
  items: Deal[];
  total: number;
}
