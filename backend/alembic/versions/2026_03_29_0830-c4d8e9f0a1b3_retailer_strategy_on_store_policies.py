"""retailer strategy fields on store_policies

Revision ID: c4d8e9f0a1b3
Revises: fb527e52428b
Create Date: 2026-03-28

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "c4d8e9f0a1b3"
down_revision: Union[str, None] = "fb527e52428b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "store_policies",
        sa.Column("retail_domain", sa.String(length=32), nullable=True),
    )
    op.add_column(
        "store_policies",
        sa.Column("target_product_types", postgresql.JSON(astext_type=sa.Text()), nullable=True),
    )
    op.add_column(
        "store_policies",
        sa.Column("pickup_window_start", sa.Time(), nullable=True),
    )
    op.add_column(
        "store_policies",
        sa.Column("pickup_window_end", sa.Time(), nullable=True),
    )
    op.add_column(
        "store_policies",
        sa.Column(
            "pickup_all_business_hours",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
    )
    op.add_column(
        "store_policies",
        sa.Column(
            "min_base_discount_pct",
            sa.Integer(),
            server_default=sa.text("20"),
            nullable=False,
        ),
    )
    op.add_column(
        "store_policies",
        sa.Column(
            "max_markdown_limit_pct",
            sa.Integer(),
            server_default=sa.text("60"),
            nullable=False,
        ),
    )
    op.add_column(
        "store_policies",
        sa.Column(
            "markdown_trigger",
            sa.String(length=32),
            server_default=sa.text("'24h_before'"),
            nullable=False,
        ),
    )
    op.add_column(
        "store_policies",
        sa.Column("packaging_policy", sa.String(length=32), nullable=True),
    )
    op.add_column(
        "store_policies",
        sa.Column(
            "allergen_acknowledged",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
    )
    op.add_column(
        "store_policies",
        sa.Column(
            "notification_preference",
            sa.String(length=32),
            server_default=sa.text("'in_app'"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("store_policies", "notification_preference")
    op.drop_column("store_policies", "allergen_acknowledged")
    op.drop_column("store_policies", "packaging_policy")
    op.drop_column("store_policies", "markdown_trigger")
    op.drop_column("store_policies", "max_markdown_limit_pct")
    op.drop_column("store_policies", "min_base_discount_pct")
    op.drop_column("store_policies", "pickup_all_business_hours")
    op.drop_column("store_policies", "pickup_window_end")
    op.drop_column("store_policies", "pickup_window_start")
    op.drop_column("store_policies", "target_product_types")
    op.drop_column("store_policies", "retail_domain")
