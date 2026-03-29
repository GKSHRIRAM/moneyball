"""Product service — CRUD, filtering, CSV bulk upload."""

import csv
import io
from datetime import date, datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import DealStatus, StoreCategory
from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.models.deal import Deal
from app.models.product import Product
from app.models.store import Store
from app.schemas.product import (
    CSVUploadResponse,
    ProductCreateRequest,
    ProductListResponse,
    ProductOut,
    ProductUpdateRequest,
)


async def get_store_for_user(db: AsyncSession, user_id: UUID) -> Store:
    """Fetch retailer's store. Raises NotFoundError if missing."""
    result = await db.execute(select(Store).where(Store.user_id == user_id))
    store = result.scalar_one_or_none()
    if not store:
        raise NotFoundError(detail="Store not found. Complete onboarding first.")
    return store


async def list_products(
    db: AsyncSession,
    store_id: UUID,
    page: int = 1,
    page_size: int = 20,
    category: str | None = None,
    expiry_filter: str | None = None,
    risk_filter: str | None = None,
) -> ProductListResponse:
    """List products with optional filters and pagination."""
    query = select(Product).where(Product.store_id == store_id)

    if category:
        try:
            cat = StoreCategory(category)
            query = query.where(Product.category == cat)
        except ValueError:
            pass  # ignore invalid category filter

    today = date.today()
    if expiry_filter == "expiring_soon":
        query = query.where(Product.expiry_date <= today + timedelta(days=7))
        query = query.where(Product.expiry_date >= today)
    elif expiry_filter == "expired":
        query = query.where(Product.expiry_date < today)

    if risk_filter == "at_risk":
        query = query.where(Product.risk_score >= 50)

    # Count total before pagination
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query) or 0

    # Apply ordering + pagination
    query = query.order_by(Product.expiry_date.asc())
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    products = result.scalars().all()

    return ProductListResponse(
        items=[ProductOut.model_validate(p) for p in products],
        total=total,
        page=page,
        page_size=page_size,
    )


async def get_product(
    db: AsyncSession, product_id: UUID, store_id: UUID
) -> Product:
    """Fetch a product, verifying store ownership."""
    result = await db.execute(
        select(Product).where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise NotFoundError(detail="Product not found")
    if str(product.store_id) != str(store_id):
        raise ForbiddenError(detail="Product does not belong to your store")
    return product


async def create_product(
    db: AsyncSession, store_id: UUID, data: ProductCreateRequest
) -> Product:
    """Create a new product with risk_score=0."""
    product = Product(
        store_id=store_id,
        name=data.name,
        category=data.category,
        mrp=data.mrp,
        cost_price=data.cost_price,
        batch_number=data.batch_number,
        expiry_date=data.expiry_date,
        quantity=data.quantity,
        image_url=data.image_url,
        risk_score=0,
    )
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


async def update_product(
    db: AsyncSession, product: Product, data: ProductUpdateRequest
) -> Product:
    """Update provided fields on an existing product."""
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)
    product.updated_at = datetime.now(timezone.utc)
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


async def delete_product(db: AsyncSession, product: Product) -> None:
    """Delete a product, checking for active deals first."""
    # Check for active deals
    result = await db.execute(
        select(Deal).where(
            Deal.product_id == product.id,
            Deal.status.in_([DealStatus.active, DealStatus.reserved]),
        )
    )
    active_deal = result.scalar_one_or_none()
    if active_deal:
        raise ConflictError(
            detail="Cannot delete product with active deals. Close the deal first."
        )
    await db.delete(product)
    await db.commit()


async def bulk_create_from_csv(
    db: AsyncSession, store_id: UUID, file_content: bytes
) -> CSVUploadResponse:
    """Parse CSV and bulk create products."""
    try:
        text = file_content.decode("utf-8-sig")  # Handle BOM
    except UnicodeDecodeError:
        text = file_content.decode("latin-1")

    reader = csv.DictReader(io.StringIO(text))

    # Normalize headers
    if reader.fieldnames:
        reader.fieldnames = [h.strip().lower() for h in reader.fieldnames]

    rows = list(reader)
    if len(rows) > 200:
        raise ConflictError(
            detail=f"CSV contains {len(rows)} rows. Maximum is 200 per upload."
        )

    created = 0
    errors: list[str] = []
    today = date.today()

    for i, row in enumerate(rows, start=2):  # start=2 because row 1 is header
        row = {k.strip().lower(): v.strip() for k, v in row.items() if k}

        # Validate required fields
        name = row.get("name", "")
        category_str = row.get("category", "")
        mrp_str = row.get("mrp", "")
        cost_str = row.get("cost_price", "")
        expiry_str = row.get("expiry_date", "")
        qty_str = row.get("quantity", "")
        batch = row.get("batch_number", "") or None

        if not name or len(name) < 2:
            errors.append(f"Row {i}: Missing or too short product name")
            continue

        # Category
        try:
            cat = StoreCategory(category_str)
        except ValueError:
            errors.append(
                f"Row {i}: Invalid category '{category_str}'. Must be bakery, grocery, or fmcg"
            )
            continue

        # MRP
        try:
            mrp = float(mrp_str)
            if mrp <= 0:
                raise ValueError
        except (ValueError, TypeError):
            errors.append(f"Row {i}: Invalid MRP '{mrp_str}'. Must be a positive number")
            continue

        # Cost price
        try:
            cost = float(cost_str)
            if cost <= 0:
                raise ValueError
        except (ValueError, TypeError):
            errors.append(
                f"Row {i}: Invalid cost_price '{cost_str}'. Must be a positive number"
            )
            continue

        # Expiry date
        try:
            expiry = date.fromisoformat(expiry_str)
            if expiry < today:
                errors.append(f"Row {i}: Expiry date {expiry_str} is in the past")
                continue
        except (ValueError, TypeError):
            errors.append(
                f"Row {i}: Invalid expiry_date '{expiry_str}'. Use YYYY-MM-DD format"
            )
            continue

        # Quantity
        try:
            qty = int(qty_str)
            if qty <= 0:
                raise ValueError
        except (ValueError, TypeError):
            errors.append(
                f"Row {i}: Invalid quantity '{qty_str}'. Must be a positive integer"
            )
            continue

        # All valid — create the product
        product = Product(
            store_id=store_id,
            name=name,
            category=cat,
            mrp=mrp,
            cost_price=cost,
            batch_number=batch,
            expiry_date=expiry,
            quantity=qty,
            risk_score=0,
        )
        db.add(product)
        created += 1

    if created > 0:
        await db.commit()

    return CSVUploadResponse(
        created=created,
        skipped=len(errors),
        errors=errors,
    )
