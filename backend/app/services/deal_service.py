from datetime import date, datetime, timezone
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import DealStatus, StoreCategory
from app.core.exceptions import ConflictError, NotFoundError
from app.models.deal import Deal
from app.models.product import Product
from app.schemas.deal import DealCreateRequest
from app.services import risk_engine


async def get_suggested_deals(db: AsyncSession, store_id: UUID) -> list[dict]:
    """
    Returns at-risk products (risk_score >= 50) that do NOT already
    have an active or draft deal, with suggested pricing.
    """
    result = await db.execute(
        select(Product)
        .where(
            Product.store_id == store_id,
            Product.risk_score >= 50,
            Product.expiry_date >= date.today(),
            Product.quantity > 0,
        )
        .order_by(Product.risk_score.desc())
    )
    products = result.scalars().all()
    suggestions = []
    
    for p in products:
        existing_deal = await db.scalar(
            select(Deal).where(
                Deal.product_id == p.id,
                Deal.status.in_([DealStatus.draft, DealStatus.active])
            )
        )
        if existing_deal:
            continue
            
        discount = risk_engine.suggest_discount(p.risk_score, StoreCategory(p.category))
        if discount == 0:
            continue
            
        deal_price = risk_engine.compute_deal_price(p.mrp, discount)
        suggestions.append({
            "product_id": str(p.id),
            "product_name": p.name,
            "category": p.category,
            "mrp": float(p.mrp),
            "suggested_discount_pct": discount,
            "suggested_deal_price": float(deal_price),
            "risk_score": p.risk_score,
            "risk_label": risk_engine.get_risk_label(p.risk_score),
            "days_to_expiry": max((p.expiry_date - date.today()).days, 0),
            "quantity": p.quantity,
        })
    return suggestions


async def create_deal(
    db: AsyncSession, store_id: UUID, data: DealCreateRequest, auto_approve: bool = False
) -> Deal:
    try:
        product_uuid = UUID(data.product_id)
    except ValueError:
        raise NotFoundError("Invalid product ID format")
    
    product = await db.get(Product, product_uuid)
    if not product or product.store_id != store_id:
        raise NotFoundError("Product not found")
        
    if product.quantity < data.quantity_to_list:
        raise ConflictError("Not enough stock to list this deal")
        
    existing = await db.scalar(
        select(Deal).where(
            Deal.product_id == product.id,
            Deal.status.in_([DealStatus.draft, DealStatus.active])
        )
    )
    if existing:
        raise ConflictError("An active or draft deal already exists for this product")

    status = DealStatus.active if auto_approve else DealStatus.draft
    deal = Deal(
        store_id=store_id,
        product_id=product.id,
        deal_price=data.deal_price,
        original_price=product.mrp,
        discount_pct=round((1 - float(data.deal_price) / float(product.mrp)) * 100),
        quantity_available=data.quantity_to_list,
        expiry_date=product.expiry_date,
        deal_type=data.deal_type,
        status=status,
        listed_at=datetime.now(timezone.utc),
        risk_score_at_listing=product.risk_score,
    )
    db.add(deal)
    await db.commit()
    await db.refresh(deal)
    return deal


async def approve_deal(db: AsyncSession, deal_id: UUID, store_id: UUID) -> Deal:
    deal = await db.get(Deal, deal_id)
    if not deal or deal.store_id != store_id:
        raise NotFoundError("Deal not found")
        
    if deal.status != DealStatus.draft:
        raise ConflictError("Only draft deals can be approved")
        
    deal.status = DealStatus.active
    deal.listed_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(deal)
    return deal


async def close_deal(db: AsyncSession, deal_id: UUID, store_id: UUID) -> Deal:
    deal = await db.get(Deal, deal_id)
    if not deal or deal.store_id != store_id:
        raise NotFoundError("Deal not found")
        
    if deal.status not in [DealStatus.active, DealStatus.draft]:
        raise ConflictError("Deal is already closed")
        
    deal.status = DealStatus.expired
    await db.commit()
    await db.refresh(deal)
    return deal


async def list_retailer_deals(
    db: AsyncSession, store_id: UUID, status: str | None = None
) -> list[Deal]:
    query = select(Deal).where(Deal.store_id == store_id)
    if status:
        try:
            deal_status = DealStatus(status)
            query = query.where(Deal.status == deal_status)
        except ValueError:
            pass
            
    query = query.order_by(Deal.listed_at.desc())
    result = await db.execute(query)
    return list(result.scalars().all())


async def auto_expire_stale_deals(db: AsyncSession) -> dict:
    """
    Called via FastAPI BackgroundTasks. Closes deals where:
    - expiry_date < today, OR
    - quantity_available = 0
    """
    result = await db.execute(
        select(Deal).where(
            Deal.status == DealStatus.active,
            or_(
                Deal.expiry_date < date.today(),
                Deal.quantity_available <= 0
            )
        )
    )
    deals = result.scalars().all()
    for deal in deals:
        deal.status = DealStatus.expired
    
    if deals:
        await db.commit()
        
    return {"expired": len(deals)}
