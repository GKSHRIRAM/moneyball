"""Product routes — retailer inventory management."""

from datetime import date
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, Query, UploadFile, BackgroundTasks
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
from app.services import product_service, risk_engine

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

    days = max((product.expiry_date - date.today()).days, 0)
    risk = risk_engine.compute_risk_score(product.expiry_date, product.quantity, product.category)
    label = risk_engine.get_risk_label(risk)
    suggested = risk_engine.suggest_discount(risk, product.category)

    return {
        "product_id": str(product.id),
        "risk_score": risk,
        "risk_label": label,
        "days_to_expiry": days,
        "suggested_discount_pct": suggested,
    }

@router.post("/rescore")
async def rescore_products(
    background_tasks: BackgroundTasks,
    user: RetailerUser,
    db: DB,
):
    """Trigger background rescore for retailer store."""
    store = await product_service.get_store_for_user(db, user.id)
    background_tasks.add_task(risk_engine.rescore_all_products_for_store, db, store.id)
    return {"message": "Rescoring started", "store_id": str(store.id)}
