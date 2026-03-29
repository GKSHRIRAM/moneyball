from datetime import date, datetime, timezone
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import StoreCategory
from app.models.product import Product

def compute_risk_score(expiry_date: date, quantity: int, category: StoreCategory) -> int:
    days_left = max((expiry_date - date.today()).days, 0)
    if days_left == 0:
        return 100
    urgency = 1 / (days_left + 1)
    stock_pressure = min(quantity / max(days_left, 1), 2)
    weights = {
        StoreCategory.bakery: 1.5,
        StoreCategory.grocery: 1.0,
        StoreCategory.fmcg: 0.7
    }
    weight = weights.get(category, 1.0)
    score = (urgency * 60 + stock_pressure * 40) * weight
    return min(100, round(score))

def get_risk_label(score: int) -> str:
    if score <= 30: return "safe"
    if score <= 60: return "watch"
    if score <= 85: return "urgent"
    return "critical"

def suggest_discount(score: int, category: StoreCategory) -> int:
    """Returns suggested discount percentage. 0 means no discount yet."""
    rules = {
        StoreCategory.bakery: [(50, 20), (70, 35), (85, 50)],
        StoreCategory.grocery: [(50, 10), (70, 25), (85, 40)],
        StoreCategory.fmcg: [(70, 15), (85, 25)],
    }
    thresholds = rules.get(category, [])
    discount = 0
    for threshold, pct in thresholds:
        if score >= threshold:
            discount = pct
    return discount

def compute_deal_price(mrp: Decimal, discount_pct: int) -> Decimal:
    factor = Decimal(str(1 - discount_pct / 100))
    return (mrp * factor).quantize(Decimal("0.01"))

async def rescore_product(db: AsyncSession, product: Product) -> Product:
    score = compute_risk_score(product.expiry_date, product.quantity, StoreCategory(product.category))
    product.risk_score = score
    product.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(product)
    return product

async def rescore_all_products_for_store(db: AsyncSession, store_id: UUID) -> dict:
    result = await db.execute(
        select(Product).where(
            Product.store_id == store_id,
            Product.expiry_date >= date.today()
        )
    )
    products = result.scalars().all()
    rescored = 0
    for product in products:
        score = compute_risk_score(product.expiry_date, product.quantity, StoreCategory(product.category))
        product.risk_score = score
        product.updated_at = datetime.now(timezone.utc)
        rescored += 1
    await db.commit()
    return {"rescored": rescored, "store_id": str(store_id)}

async def rescore_all_products_platform(db: AsyncSession) -> dict:
    """Called by the daily rescore endpoint. Rescores every non-expired product."""
    result = await db.execute(
        select(Product).where(Product.expiry_date >= date.today())
    )
    products = result.scalars().all()
    for product in products:
        score = compute_risk_score(product.expiry_date, product.quantity, StoreCategory(product.category))
        product.risk_score = score
        product.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return {"rescored": len(products)}
