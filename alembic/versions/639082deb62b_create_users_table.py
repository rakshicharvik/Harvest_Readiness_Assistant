"""create users table

Revision ID: 639082deb62b
Revises: 
Create Date: 2025-12-16
"""

from alembic import op
import sqlalchemy as sa


revision = "639082deb62b"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("username", sa.String(length=100), nullable=False, unique=True),
        sa.Column("is_farmer", sa.Boolean(), nullable=False),
    )


def downgrade():
    op.drop_table("users")
