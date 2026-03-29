"""Pydantic schemas for retailer onboarding & strategy (store_policies extension)."""

from __future__ import annotations

from datetime import datetime, time
from typing import Any, Dict, List, Optional, Union
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.core.constants import (
    MarkdownTriggerWindow,
    NotificationPreference,
    PackagingPolicy,
    RetailDomain,
    TargetProductType,
)


class StoreStrategyRead(BaseModel):
    """ORM-backed read model for `store_policies` (strategy + legacy policy fields)."""

    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    id: UUID
    store_id: UUID

    retail_domain: Optional[str] = None
    target_product_types: Optional[Union[List[Any], Dict[str, Any]]] = None

    pickup_window_start: Optional[time] = None
    pickup_window_end: Optional[time] = None
    pickup_all_business_hours: bool = False

    min_base_discount_pct: int = 20
    max_markdown_limit_pct: int = 60
    markdown_trigger: str = "24h_before"

    auto_approve: bool = False

    packaging_policy: Optional[str] = None
    allergen_acknowledged: bool = False
    notification_preference: str = "in_app"

    min_discount_pct: int = Field(ge=0, le=100)
    fulfillment_mode: str
    hide_outside_hours: bool
    enabled_categories: Optional[Union[List[Any], Dict[str, Any]]] = None

    created_at: datetime
    updated_at: datetime


class StoreStrategyUpdate(BaseModel):
    """PATCH body — optional fields; cross-field rules apply when enough data is sent."""

    model_config = ConfigDict(extra="forbid")

    retail_domain: Optional[RetailDomain] = None
    target_product_types: Optional[List[TargetProductType]] = None

    pickup_window_start: Optional[time] = None
    pickup_window_end: Optional[time] = None
    pickup_all_business_hours: Optional[bool] = None

    min_base_discount_pct: Optional[int] = Field(default=None, ge=10, le=50)
    max_markdown_limit_pct: Optional[int] = Field(default=None, ge=30, le=90)
    markdown_trigger: Optional[MarkdownTriggerWindow] = None

    auto_approve: Optional[bool] = None

    packaging_policy: Optional[PackagingPolicy] = None
    allergen_acknowledged: Optional[bool] = None
    notification_preference: Optional[NotificationPreference] = None

    @field_validator("target_product_types", mode="before")
    @classmethod
    def empty_list_to_none(cls, v: object) -> object:
        if v == []:
            return []
        return v

    @model_validator(mode="after")
    def markdown_limits_ordered(self) -> "StoreStrategyUpdate":
        lo = self.min_base_discount_pct
        hi = self.max_markdown_limit_pct
        if lo is not None and hi is not None and hi <= lo:
            raise ValueError(
                "max_markdown_limit_pct must be greater than min_base_discount_pct"
            )
        return self


class StoreStrategyForm(BaseModel):
    """Strict validation for a complete onboarding / strategy form submission."""

    retail_domain: RetailDomain
    target_product_types: List[TargetProductType] = Field(min_length=1)

    pickup_window_start: Optional[time] = None
    pickup_window_end: Optional[time] = None
    pickup_all_business_hours: bool = False

    min_base_discount_pct: int = Field(default=20, ge=10, le=50)
    max_markdown_limit_pct: int = Field(default=60, ge=30, le=90)
    markdown_trigger: MarkdownTriggerWindow = MarkdownTriggerWindow.h24_before

    auto_approve: bool = False

    packaging_policy: PackagingPolicy
    allergen_acknowledged: bool
    notification_preference: NotificationPreference = NotificationPreference.in_app

    @field_validator("allergen_acknowledged")
    @classmethod
    def allergen_required(cls, v: bool) -> bool:
        if not v:
            raise ValueError("allergen_acknowledged must be true to submit")
        return v

    @model_validator(mode="after")
    def markdown_limits_ordered(self) -> "StoreStrategyForm":
        if self.max_markdown_limit_pct <= self.min_base_discount_pct:
            raise ValueError(
                "max_markdown_limit_pct must be greater than min_base_discount_pct"
            )
        return self

    @model_validator(mode="after")
    def pickup_window_consistency(self) -> "StoreStrategyForm":
        if self.pickup_all_business_hours:
            return self
        if self.pickup_window_start is None or self.pickup_window_end is None:
            raise ValueError(
                "pickup_window_start and pickup_window_end are required when "
                "pickup_all_business_hours is false"
            )
        return self
