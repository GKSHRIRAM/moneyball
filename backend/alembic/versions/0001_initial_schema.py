"""initial_schema

Revision ID: 0001
Revises: None
Create Date: 2026-03-28

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql
from geoalchemy2 import Geometry

# revision identifiers, used by Alembic.
revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Extensions ────────────────────────────────────────────
    op.execute('CREATE EXTENSION IF NOT EXISTS postgis')
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    # ── 1. users ──────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("email", sa.String(255), unique=True, index=True, nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.Enum("consumer", "retailer", name="userrole",
                                  create_type=True), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"),
                  nullable=False),
    )

    # ── 2. stores ─────────────────────────────────────────────
    op.create_table(
        "stores",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("address", sa.Text(), nullable=False),
        sa.Column("lat", sa.Numeric(9, 6), nullable=False),
        sa.Column("lng", sa.Numeric(9, 6), nullable=False),
        sa.Column("location", Geometry(geometry_type="POINT", srid=4326),
                  nullable=True),
        sa.Column("category", sa.Enum("bakery", "grocery", "fmcg",
                                       name="storecategory", create_type=True),
                  nullable=False),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("open_time", sa.Time(), nullable=True),
        sa.Column("close_time", sa.Time(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"),
                  nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=False),
    )
    op.execute("CREATE INDEX IF NOT EXISTS idx_stores_location ON stores USING gist (location)")

    # ── 3. store_policies ─────────────────────────────────────
    op.create_table(
        "store_policies",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("store_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("stores.id", ondelete="CASCADE"),
                  unique=True, nullable=False),
        sa.Column("min_discount_pct", sa.Integer(), server_default=sa.text("15"),
                  nullable=False),
        sa.Column("auto_approve", sa.Boolean(), server_default=sa.text("false"),
                  nullable=False),
        sa.Column("fulfillment_mode",
                  sa.Enum("pickup", "delivery", "both",
                          name="fulfillmentmode", create_type=True),
                  server_default="pickup", nullable=False),
        sa.Column("hide_outside_hours", sa.Boolean(),
                  server_default=sa.text("false"), nullable=False),
        sa.Column("enabled_categories", postgresql.JSON(), nullable=True),
    )

    # ── 4. products ───────────────────────────────────────────
    op.create_table(
        "products",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("store_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("stores.id", ondelete="CASCADE"),
                  index=True, nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("category", sa.Enum("bakery", "grocery", "fmcg",
                                       name="storecategory",
                                       create_type=False),
                  nullable=False),
        sa.Column("mrp", sa.Numeric(10, 2), nullable=False),
        sa.Column("cost_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("image_url", sa.String(500), nullable=True),
        sa.Column("batch_number", sa.String(100), nullable=True),
        sa.Column("expiry_date", sa.Date(), index=True, nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("risk_score", sa.Integer(), server_default=sa.text("0"),
                  nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=False),
    )

    # ── 5. categories ─────────────────────────────────────────
    op.create_table(
        "categories",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("slug", sa.String(50), unique=True, nullable=False),
        sa.Column("platform_policy", postgresql.JSON(), nullable=True),
    )
    # Seed data with conflict handling
    op.execute(
        """
        INSERT INTO categories (id, name, slug, platform_policy) VALUES
        (1, 'Bakery',  'bakery',  '{"min_days_before_list": 1, "pickup_only": false}'),
        (2, 'Grocery', 'grocery', '{"min_days_before_list": 3, "pickup_only": false}'),
        (3, 'FMCG',    'fmcg',    '{"min_days_before_list": 7, "pickup_only": false}')
        ON CONFLICT (id) DO NOTHING
        """
    )

    # ── 6. deals ──────────────────────────────────────────────
    op.create_table(
        "deals",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("store_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("stores.id", ondelete="CASCADE"),
                  index=True, nullable=False),
        sa.Column("product_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("products.id", ondelete="CASCADE"),
                  nullable=False),
        sa.Column("deal_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("original_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("discount_pct", sa.Integer(), nullable=False),
        sa.Column("quantity_available", sa.Integer(), nullable=False),
        sa.Column("expiry_date", sa.Date(), nullable=False),
        sa.Column("deal_type", sa.Enum("flash", "clearance", "bundle",
                                        name="dealtype", create_type=True),
                  nullable=False),
        sa.Column("status", sa.Enum("draft", "active", "reserved", "sold", "expired",
                                     name="dealstatus", create_type=True),
                  server_default="draft", index=True, nullable=False),
        sa.Column("listed_at", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("risk_score_at_listing", sa.Integer(),
                  server_default=sa.text("0"), nullable=False),
    )

    # ── 7. reservations ───────────────────────────────────────
    op.create_table(
        "reservations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("deal_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("deals.id", ondelete="CASCADE"), nullable=False),
        sa.Column("consumer_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("store_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("stores.id", ondelete="CASCADE"), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("status", sa.Enum("pending", "confirmed", "completed", "cancelled",
                                     name="reservationstatus", create_type=True),
                  server_default="pending", nullable=False),
        sa.Column("hold_expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("reserved_at", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=False),
        sa.Column("confirmed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )

    # ── 8. consumer_profiles ──────────────────────────────────
    op.create_table(
        "consumer_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id", ondelete="CASCADE"),
                  unique=True, nullable=False),
        sa.Column("home_lat", sa.Float(), nullable=True),
        sa.Column("home_lng", sa.Float(), nullable=True),
        sa.Column("work_lat", sa.Float(), nullable=True),
        sa.Column("work_lng", sa.Float(), nullable=True),
        sa.Column("preferred_radius_km", sa.Integer(),
                  server_default=sa.text("3"), nullable=False),
        sa.Column("preferred_categories", postgresql.JSON(), nullable=True),
        sa.Column("push_subscribed", sa.Boolean(),
                  server_default=sa.text("false"), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("consumer_profiles")
    op.drop_table("reservations")
    op.drop_table("deals")
    op.drop_table("categories")
    op.drop_table("products")
    op.drop_table("store_policies")
    op.drop_table("stores")
    op.drop_table("users")

    # Drop enums
    op.execute("DROP TYPE IF EXISTS reservationstatus")
    op.execute("DROP TYPE IF EXISTS dealstatus")
    op.execute("DROP TYPE IF EXISTS dealtype")
    op.execute("DROP TYPE IF EXISTS fulfillmentmode")
    op.execute("DROP TYPE IF EXISTS storecategory")
    op.execute("DROP TYPE IF EXISTS userrole")
