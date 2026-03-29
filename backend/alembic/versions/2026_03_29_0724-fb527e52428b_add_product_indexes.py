"""add_product_indexes

Revision ID: fb527e52428b
Revises: 5feabb822c4c
Create Date: 2026-03-29 07:24:04.321340

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fb527e52428b'
down_revision: Union[str, None] = '5feabb822c4c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(op.f('ix_products_category'), 'products', ['category'], unique=False)
    op.create_index(op.f('ix_products_risk_score'), 'products', ['risk_score'], unique=False)
    # ### end Alembic commands ###


def downgrade() -> None:
    op.drop_index(op.f('ix_products_risk_score'), table_name='products')
    op.drop_index(op.f('ix_products_category'), table_name='products')
    # ### end Alembic commands ###
