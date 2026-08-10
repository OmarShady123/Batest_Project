"""Remove two-factor authentication

Revision ID: 006_remove_two_factor
Revises: 005_remove_editor_role
Create Date: 2026-08-06

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '006_remove_two_factor'
down_revision = '005_remove_editor_role'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_table('two_factor_backup_codes')

    op.drop_column('users', 'two_factor_enabled')
    op.drop_column('users', 'two_factor_secret_encrypted')
    op.drop_column('users', 'two_factor_last_used_step')
    op.drop_column('users', 'two_factor_enabled_at')


def downgrade() -> None:
    # Recreates the shape only. Enrolled secrets and backup codes are destroyed
    # by the upgrade and cannot be recovered — every user would re-enrol.
    op.add_column('users', sa.Column('two_factor_enabled', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('users', sa.Column('two_factor_secret_encrypted', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('two_factor_last_used_step', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('two_factor_enabled_at', sa.DateTime(timezone=True), nullable=True))

    op.create_table(
        'two_factor_backup_codes',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('code_hash', sa.String(255), nullable=False),
        sa.Column('used_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_two_factor_backup_codes_user_id', 'two_factor_backup_codes', ['user_id'])
