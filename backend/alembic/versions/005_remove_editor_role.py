"""Remove the editor role, leaving only visitor and admin

Revision ID: 005_remove_editor_role
Revises: 004_two_factor_auth
Create Date: 2026-08-06

"""
from alembic import op

revision = '005_remove_editor_role'
down_revision = '004_two_factor_auth'
branch_labels = None
depends_on = None

CONSTRAINT = 'check_valid_user_role'


def upgrade() -> None:
    # Any account still on the removed role falls back to the least-privileged
    # one, so the tightened constraint below cannot fail on existing data.
    op.execute("UPDATE users SET role = 'visitor' WHERE role = 'editor'")

    op.drop_constraint(CONSTRAINT, 'users', type_='check')
    op.create_check_constraint(CONSTRAINT, 'users', "role IN ('visitor', 'admin')")


def downgrade() -> None:
    # Restores the permitted values only. Which accounts used to be editors is
    # not recorded anywhere, so that assignment cannot be recovered.
    op.drop_constraint(CONSTRAINT, 'users', type_='check')
    op.create_check_constraint(CONSTRAINT, 'users', "role IN ('visitor', 'admin', 'editor')")
