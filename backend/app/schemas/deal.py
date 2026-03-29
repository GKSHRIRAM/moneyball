from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field
import uuid

from app.core.constants import DealType, DealStatus

class DealCreateRequest(BaseModel):
    product_id: str
    deal_price: Decimal = Field(gt=0)
    quantity_to_list: int = Field(gt=0)
    deal_type: DealType = DealType.clearance
    
class DealOut(BaseModel):
    id: str | uuid.UUID
    store_id: str | uuid.UUID
    product_id: str | uuid.UUID
    deal_price: float
    original_price: float
    discount_pct: int
    quantity_available: int
    expiry_date: str
    deal_type: str | DealType
    status: str | DealStatus
    listed_at: str | datetime | None = None
    risk_score_at_listing: int
    
    product_name: str | None = None
    store_name: str | None = None
    days_to_expiry: int | None = None
    is_urgent: bool | None = None
    
    model_config = ConfigDict(from_attributes=True)
    
class DealSuggestion(BaseModel):
    product_id: str | uuid.UUID
    product_name: str
    category: str
    mrp: float
    suggested_discount_pct: int
    suggested_deal_price: float
    risk_score: int
    risk_label: str
    days_to_expiry: int
    quantity: int
    
class DealListResponse(BaseModel):
    items: list[DealOut]
    total: int
