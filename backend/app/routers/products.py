"""Product routes — retailer inventory management."""

from datetime import date
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, Query, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import UserRole
from app.core.dependencies import get_db, require_role
from app.models.user import User
from app.schemas.product import (
    CSVUploadResponse,
    ProductCreateRequest,
    ProductListResponse,
    ProductOut,
    ProductUpdateRequest,
)
from app.services import product_service

router = APIRouter()

RetailerUser = Annotated[User, Depends(require_role(UserRole.retailer))]
DB = Annotated[AsyncSession, Depends(get_db)]


@router.get("", response_model=ProductListResponse)
async def list_products(
    user: RetailerUser,
    db: DB,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
    category: str | None = Query(default=None),
    expiry_filter: str | None = Query(default=None),
    risk_filter: str | None = Query(default=None),
):
    """List products for the current retailer with filtering & pagination."""
    store = await product_service.get_store_for_user(db, user.id)
    return await product_service.list_products(
        db,
        store.id,
        page=page,
        page_size=page_size,
        category=category,
        expiry_filter=expiry_filter,
        risk_filter=risk_filter,
    )


@router.post("", status_code=201, response_model=ProductOut)
async def create_product(
    data: ProductCreateRequest,
    user: RetailerUser,
    db: DB,
):
    """Create a new product."""
    store = await product_service.get_store_for_user(db, user.id)
    product = await product_service.create_product(db, store.id, data)
    return product


@router.post("/bulk-upload", response_model=CSVUploadResponse)
async def bulk_upload(
    user: RetailerUser,
    db: DB,
    file: UploadFile = File(...),
):
    """Bulk upload products from CSV file."""
    if not file.filename or not file.filename.lower().endswith(".csv"):
        from fastapi import HTTPException

        raise HTTPException(status_code=400, detail="Only .csv files are accepted")
    content = await file.read()
    store = await product_service.get_store_for_user(db, user.id)
    return await product_service.bulk_create_from_csv(db, store.id, content)


@router.get("/{product_id}", response_model=ProductOut)
async def get_product(
    product_id: UUID,
    user: RetailerUser,
    db: DB,
):
    """Get a specific product."""
    store = await product_service.get_store_for_user(db, user.id)
    product = await product_service.get_product(db, product_id, store.id)
    return product


@router.put("/{product_id}", response_model=ProductOut)
async def update_product(
    product_id: UUID,
    data: ProductUpdateRequest,
    user: RetailerUser,
    db: DB,
):
    """Update a product."""
    store = await product_service.get_store_for_user(db, user.id)
    product = await product_service.get_product(db, product_id, store.id)
    updated = await product_service.update_product(db, product, data)
    return updated


@router.delete("/{product_id}")
async def delete_product(
    product_id: UUID,
    user: RetailerUser,
    db: DB,
):
    """Delete a product."""
    store = await product_service.get_store_for_user(db, user.id)
    product = await product_service.get_product(db, product_id, store.id)
    await product_service.delete_product(db, product)
    return {"message": "Product deleted"}


@router.get("/{product_id}/risk")
async def get_product_risk(
    product_id: UUID,
    user: RetailerUser,
    db: DB,
):
    """Get risk assessment for a product (computed on the fly)."""
    store = await product_service.get_store_for_user(db, user.id)
    product = await product_service.get_product(db, product_id, store.id)

    days = (product.expiry_date - date.today()).days
    # Simple risk heuristic for Phase 3 (Phase 4 will improve)
    if days <= 0:
        risk = 100
    elif days <= 2:
        risk = 90
    elif days <= 5:
        risk = 75
    elif days <= 7:
        risk = 60
    elif days <= 14:
        risk = 40
    else:
        risk = max(0, 20 - days)

    # Risk label
    if risk <= 30:
        label = "safe"
    elif risk <= 60:
        label = "watch"
    elif risk <= 85:
        label = "urgent"
    else:
        label = "critical"

    # Suggested discount
    if risk >= 86:
        suggested = 50
    elif risk >= 61:
        suggested = 35
    elif risk >= 31:
        suggested = 20
    else:
        suggested = 10

    return {
        "product_id": str(product.id),
        "risk_score": risk,
        "risk_label": label,
        "days_to_expiry": days,
        "suggested_discount_pct": suggested,
    }
