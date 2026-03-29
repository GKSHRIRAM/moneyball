"""add_role_index_to_users

Revision ID: 44569a319500
Revises: 0001
Create Date: 2026-03-28 23:21:29.649243

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '44569a319500'
down_revision: Union[str, None] = '0001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index("ix_users_role", "users", ["role"], if_not_exists=True)
    op.create_index("ix_users_is_active", "users", ["is_active"], if_not_exists=True)


def downgrade() -> None:
    op.drop_index("ix_users_is_active", table_name="users")
    op.drop_index("ix_users_role", table_name="users")
