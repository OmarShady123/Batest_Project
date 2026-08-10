"""Two-factor authentication fields and backup-code table

Revision ID: 004_two_factor_auth
Revises: 003_audit_log_notifications
Create Date: 2026-08-04

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '004_two_factor_auth'
down_revision = '003_audit_log_notifications'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. Add 2FA fields to users table
    op.add_column('users', sa.Column('two_factor_enabled', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('users', sa.Column('two_factor_secret_encrypted', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('two_factor_last_used_step', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('two_factor_enabled_at', sa.DateTime(timezone=True), nullable=True))

    # 2. Create two_factor_backup_codes table
    op.create_table(
        'two_factor_backup_codes',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('code_hash', sa.String(length=255), nullable=False),
        sa.Column('used_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_two_factor_backup_codes_user_id', 'two_factor_backup_codes', ['user_id'], unique=False)

def downgrade() -> None:
    op.drop_index('ix_two_factor_backup_codes_user_id', table_name='two_factor_backup_codes')
    op.drop_table('two_factor_backup_codes')

    op.drop_column('users', 'two_factor_enabled_at')
    op.drop_column('users', 'two_factor_last_used_step')
    op.drop_column('users', 'two_factor_secret_encrypted')
    op.drop_column('users', 'two_factor_enabled')
