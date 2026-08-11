"""Add Google identity and local-password capability fields

Revision ID: 007_authentication_upgrade
Revises: 006_remove_two_factor
Create Date: 2026-08-11

"""
from alembic import op
import sqlalchemy as sa


revision = "007_authentication_upgrade"
down_revision = "006_remove_two_factor"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "has_local_password",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
    )
    op.add_column(
        "users",
        sa.Column("google_sub", sa.String(length=255), nullable=True),
    )
    op.create_index(
        "ix_users_google_sub",
        "users",
        ["google_sub"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_users_google_sub", table_name="users")
    op.drop_column("users", "google_sub")
    op.drop_column("users", "has_local_password")
